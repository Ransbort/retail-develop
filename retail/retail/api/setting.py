import frappe
import socket
from weasyprint import HTML, CSS
import json

@frappe.whitelist()
def create_Sample_items(item_data: dict):
    item_code = item_data.get("item_code")
    if not item_code:
        frappe.throw("Missing required field: item_code")

    if item_data.get("item_group"):
        if not frappe.db.exists("Item Group", group_name):
            item_group = frappe.get_doc({
                "doctype": "Item Group",
                "item_group_name": group_name,
                "parent_item_group": "All Item Groups",
                "is_group": 0
            })
            item_group.insert(ignore_permissions=True)
            return item_group.name

    if frappe.db.exists("Item", item_code):
        frappe.msgprint(f"Item <b>{item_code}</b> already exists.")
        return item_code

    # Create new item
    item = frappe.get_doc({
        "doctype": "Item",
        **item_data
    })

    item.insert()
    return item.name

@frappe.whitelist()
def create_all_sample_items(sample_products: list):
    created, failed = [], []
    for product in sample_products:
        try:
            name = create_Sample_items(product)
            created.append(name)
        except Exception as e:
            frappe.log_error(message=str(e), title=f"Error creating {product.get('item_code')}")
            failed.append(product.get("item_code"))
    return {
        "created": created,
        "failed": failed
    }

@frappe.whitelist()
def delete_all_sample_items():
    """Delete all items created as sample data (SAMPLE-ITEM-###)"""
    try:
        items = frappe.get_all("Item", filters=[["item_code", "like", "SAMPLE-ITEM-%"]], pluck="name")

        if not items:
            return {"status": "empty", "message": "No sample items found to delete."}

        deleted_count = 0
        for name in items:
            try:
                frappe.delete_doc("Item", name)
                deleted_count += 1
            except Exception as e:
                frappe.log_error(f"Failed to delete {name}: {str(e)}", "Delete Sample Items")

        return {
            "status": "success",
            "deleted_count": deleted_count,
            "message": f"Deleted {deleted_count} sample items successfully."
        }

    except Exception as e:
        frappe.log_error(str(e), "delete_all_sample_items Error")
        frappe.throw(f"Error deleting sample items: {e}")

@frappe.whitelist()
def update_pos_profile_settings(pos_profile_name, settings):
    settings = frappe.parse_json(settings)
    frappe.db.set_value("POS Profile", pos_profile_name, settings, update_modified=False)
    return {"success": True}

def get_paper_size(paper_size: str) -> tuple[int, int | None]:
    """Get paper size from paper_size string"""

    PAPER_SIZES = {
        "58mm": {"width": 58,  "height": 0},
        "80mm": {"width": 80,  "height": 0},
        "A4":   {"width": 210, "height": 297},
        "A5":   {"width": 148, "height": 210},
    }

    paper = PAPER_SIZES.get(paper_size, {"width": 80, "height": 0})
    return paper["width"], paper["height"]

@frappe.whitelist()
def print_with_ip(invoice_name, printer):

    printer_type = printer.get("posa_printer_type", "Thermal Printer")
    paper_width, paper_height = get_paper_size(printer.get("posa_paper_size"))
    page_size = f"{paper_width}mm {paper_height}mm" if paper_height else f"{paper_width}mm auto"

    printer_ip   = printer.get("posa_printer_ip")
    printer_port = int(printer.get("posa_printer_port", 9100))

    invoice, payments = _get_invoice_data(invoice_name)

    html = _build_receipt_html(invoice, payments, printer_type, paper_width, paper_height, page_size)
    css = CSS(string=f"@page {{ size: {page_size}; margin: 4mm 3mm; }}")
    pdf_bytes = HTML(string=html).write_pdf(stylesheets=[css])

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(5)
    try:
        sock.connect((printer_ip, printer_port))
        sock.sendall(pdf_bytes)
        frappe.logger().info(f"[print_with_ip] {printer_type} | {invoice_name} → {printer_ip}:{printer_port} | {page_size}")
    except Exception as e:
        frappe.logger().error(f"[print_with_ip] {e}")
        frappe.throw(f"Printer error: {e}")
    finally:
        sock.close()

    return {"status": "ok", "invoice": invoice_name, "printer_type": printer_type}


def _get_invoice_data(invoice_name: str):
    invoice  = frappe.get_doc("Sales Invoice", invoice_name)
    payments = frappe.get_all(
        "Sales Invoice Payment",
        filters={"parent": invoice_name},
        fields=["mode_of_payment", "amount"]
    )
    return invoice, payments

@frappe.whitelist()
def get_invoice_html(invoice_name: str, printer: dict):

    printer_type = printer.get("posa_printer_type", "Thermal Printer")
    paper_width, paper_height = get_paper_size(printer.get("posa_paper_size"))
    page_size = f"{paper_width}mm {paper_height}mm" if paper_height else f"{paper_width}mm auto"

    invoice, payments = _get_invoice_data(invoice_name)

    return _build_receipt_html(invoice, payments, printer_type, paper_width, paper_height, page_size)


def _build_receipt_html(invoice, payments, printer_type, paper_width, paper_height, page_size):

        items_rows = ""
        for item in invoice.items:
            items_rows += f"""
                <tr>
                    <td>{item.item_name}</td>
                    <td class="center">{int(item.qty)}</td>
                    <td class="right">{item.amount:,.2f}</td>
                </tr>"""

        payments_rows = ""
        paid_total = 0
        for p in payments:
            paid_total += p.amount
            payments_rows += f"""
                <tr>
                    <td>{p.mode_of_payment}</td>
                    <td class="right">{p.amount:,.2f}</td>
                </tr>"""

        change = paid_total - invoice.grand_total
        is_thermal = printer_type == "Thermal Printer"

        if paper_width <= 80:
            base_font, title_font, header_font = "11px", "14px", "12px"
        else:
            base_font, title_font, header_font = "13px", "17px", "14px"

        header_style = (
            "text-align:center"
            if is_thermal else
            "text-align:center; background:#000; color:#fff; padding:6px 0"
        )
        divider_style = (
            "border:none; border-top:1px dashed #000; margin:5px 0"
            if is_thermal else
            "border:none; border-top:2px solid #000; margin:6px 0"
        )

        return f"""<!DOCTYPE html>
                    <html>
                    <head>
                    <meta charset="utf-8">
                    <title>{invoice.name}</title>
                    <style>
                        @page {{ size: {page_size}; margin: 4mm 3mm; }}
                        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
                        body {{
                        font-family: {'monospace' if is_thermal else 'Arial, sans-serif'};
                        font-size: {base_font};
                        color: #000;
                        width: {paper_width}mm;
                        margin: 4mm auto;
                        }}
                        .center  {{ text-align: center; }}
                        .right   {{ text-align: right; }}
                        .bold    {{ font-weight: bold; }}
                        .divider {{ {divider_style} }}
                        .section-title {{
                        font-weight: bold;
                        font-size: {header_font};
                        margin: 5px 0 3px;
                        {header_style};
                        }}
                        table {{ width: 100%; border-collapse: collapse; font-size: {base_font}; }}
                        th {{ border-bottom: 1px dashed #000; padding: 2px 0; text-align: left; }}
                        th.right, td.right {{ text-align: right; }}
                        th.center, td.center {{ text-align: center; }}
                        td {{ padding: 2px 0; }}
                        .total-row td {{
                        font-weight: bold;
                        font-size: {header_font};
                        border-top: 1px dashed #000;
                        padding-top: 3px;
                        }}
                        .footer {{ text-align: center; font-size: 10px; margin-top: 8px; color: #555; }}
                    </style>
                    </head>
                    <body>
                    <div class="center bold" style="font-size:{title_font}">Restaurant POS</div>
                    <div class="center" style="font-size:10px;color:#555;margin-top:2px">
                        {invoice.posting_date} &nbsp; {str(invoice.posting_time)[:5]}
                    </div>
                    <hr class="divider">
                    <table>
                        <tr><td>Invoice</td> <td class="right bold">{invoice.name}</td></tr>
                        <tr><td>Customer</td><td class="right">{invoice.customer_name}</td></tr>
                        <tr><td>Cashier</td> <td class="right">{invoice.owner}</td></tr>
                    </table>
                    <hr class="divider">
                    <div class="section-title">ITEMS</div>
                    <table>
                        <thead>
                        <tr>
                            <th style="width:55%">Item</th>
                            <th class="center" style="width:15%">Qty</th>
                            <th class="right"  style="width:30%">Amount</th>
                        </tr>
                        </thead>
                        <tbody>{items_rows}</tbody>
                        <tfoot>
                        <tr class="total-row">
                            <td colspan="2">TOTAL</td>
                            <td class="right">{invoice.grand_total:,.2f}</td>
                        </tr>
                        </tfoot>
                    </table>
                    <hr class="divider">
                    <div class="section-title">PAYMENTS</div>
                    <table>
                        <thead><tr><th>Method</th><th class="right">Amount</th></tr></thead>
                        <tbody>{payments_rows}</tbody>
                    </table>
                    {f'<table style="margin-top:4px"><tr><td>Change</td><td class="right">{change:,.2f}</td></tr></table>' if change > 0 else ''}
                    <hr class="divider">
                    <div class="footer">Thank you!</div>
                    </body>
                    </html>
                """

@frappe.whitelist()
def view_invoice(invoice_name: str, printer: dict):

    frappe.has_permission("Sales Invoice", doc=invoice_name, throw=True)

    page_size = printer.get("posa_paper_size", "80mm")

    thermal_sizes = {"58mm", "80mm"}
    if page_size in thermal_sizes:
        return "POS Thermal Receipt"

    page_formats = {
            "A4": "POS A4 Invoice",
            "A5": "POS A5 Invoice",
        }

    html = frappe.get_print(
        doctype="Sales Invoice",
        name=invoice_name,
        print_format=page_formats.get(page_size, "POS A4 Invoice"),
        as_pdf=False,
        letterhead=None,
    )
    return html
