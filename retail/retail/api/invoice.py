import frappe
from frappe import _
from frappe.model.mapper import get_mapped_doc
from erpnext.accounts.party import get_party_account
from frappe.utils import flt, add_days, getdate, nowdate
from frappe.utils.background_jobs import enqueue
from erpnext.controllers.sales_and_purchase_return import make_return_doc
from erpnext.stock.doctype.batch.batch import get_batch_no, get_batch_qty
from erpnext.accounts.utils import get_outstanding_invoices as _get_outstanding_invoices


@frappe.whitelist()
def get_pos_profile_taxes(pos_profile_name):
    pos = frappe.get_cached_doc("POS Profile", pos_profile_name)

    taxes = []
    if pos.taxes_and_charges:
        template = frappe.get_cached_doc(
            "Sales Taxes and Charges Template", pos.taxes_and_charges
        )
        for t in template.taxes:
            taxes.append({
                "account_head": t.account_head,
                "description":  t.description or t.account_head,
                "rate":         flt(t.rate),
                "charge_type":  t.charge_type,
                "amount":       flt(t.amount) if t.charge_type == "Actual" else None,
            })

    return {
        "taxes_and_charges": pos.taxes_and_charges,
        "tax_category":      pos.tax_category,
        "taxes": taxes,
    }


def get_cash_account(invoice_doc, payment_mode):
    mop_account = frappe.db.get_value(
        "Mode of Payment Account",
        {"parent": payment_mode, "company": invoice_doc.company},
        "default_account",
    )

    if not mop_account:
        frappe.throw(
            _("Please set a default account for Mode of Payment {0} in company {1}").format(
                payment_mode, invoice_doc.company
            )
        )

    return mop_account

def redeeming_customer_credit(invoice_doc, data, is_payment_entry, total_cash, cash_account, payments):
    today = nowdate()
    if data.get("redeemed_customer_credit"):
        cost_center = frappe.get_value(
            "POS Profile", invoice_doc.pos_profile, "cost_center"
        )
        if not cost_center:
            cost_center = frappe.get_value(
                "Company", invoice_doc.company, "cost_center"
            )
        if not cost_center:
            frappe.throw(
                _("Cost Center is not set in pos profile {}").format(
                    invoice_doc.pos_profile
                )
            )
        for row in data.get("customer_credit_dict"):
            if row["type"] == "Invoice" and row["credit_to_redeem"]:
                outstanding_invoice = frappe.get_doc(
                    "Sales Invoice", row["credit_origin"]
                )

                jv_doc = frappe.get_doc(
                    {
                        "doctype": "Journal Entry",
                        "voucher_type": "Journal Entry",
                        "posting_date": today,
                        "company": invoice_doc.company,
                    }
                )

                jv_debit_entry = {
                    "account": outstanding_invoice.debit_to,
                    "party_type": "Customer",
                    "party": invoice_doc.customer,
                    "reference_type": "Sales Invoice",
                    "reference_name": outstanding_invoice.name,
                    "debit_in_account_currency": row["credit_to_redeem"],
                    "cost_center": cost_center,
                }

                jv_credit_entry = {
                    "account": invoice_doc.debit_to,
                    "party_type": "Customer",
                    "party": invoice_doc.customer,
                    "reference_type": "Sales Invoice",
                    "reference_name": invoice_doc.name,
                    "credit_in_account_currency": row["credit_to_redeem"],
                    "cost_center": cost_center,
                }

                jv_doc.append("accounts", jv_debit_entry)
                jv_doc.append("accounts", jv_credit_entry)

                jv_doc.flags.ignore_permissions = True
                frappe.flags.ignore_account_permission = True
                jv_doc.set_missing_values()
                jv_doc.save()
                jv_doc.submit()

    if is_payment_entry and total_cash > 0:
        for payment in payments:
            if not payment.amount:
                continue
            payment_entry_doc = frappe.get_doc(
                {
                    "doctype": "Payment Entry",
                    "posting_date": today,
                    "payment_type": "Receive",
                    "party_type": "Customer",
                    "party": invoice_doc.customer,
                    "paid_amount": payment.amount,
                    "received_amount": payment.amount,
                    "paid_from": invoice_doc.debit_to,
                    "paid_to": payment.account,
                    "company": invoice_doc.company,
                    "mode_of_payment": payment.mode_of_payment,
                    "reference_no": invoice_doc.posa_pos_opening_shift,
                    "reference_date": today,
                }
            )

            payment_reference = {
                "allocated_amount": payment.amount,
                "due_date": data.get("due_date"),
                "reference_doctype": "Sales Invoice",
                "reference_name": invoice_doc.name,
            }

            payment_entry_doc.append("references", payment_reference)
            payment_entry_doc.flags.ignore_permissions = True
            frappe.flags.ignore_account_permission = True
            payment_entry_doc.save()
            payment_entry_doc.submit()


def submit_in_background_job(kwargs):
    invoice = kwargs.get("invoice")
    data = kwargs.get("data")
    is_payment_entry = kwargs.get("is_payment_entry")
    total_cash = kwargs.get("total_cash")
    cash_account = kwargs.get("cash_account")
    payments = kwargs.get("payments")

    invoice_doc = frappe.get_doc("Sales Invoice", invoice)
    invoice_doc.update_stock = 1

    invoice_doc.submit()
    redeeming_customer_credit(
        invoice_doc, data, is_payment_entry, total_cash, cash_account, payments
    )


def apply_customer_credit(invoice_doc, data):
    is_payment_entry = 0
    if data.get("redeemed_customer_credit"):
        for row in data.get("customer_credit_dict", []):
            if row.get("credit_to_redeem"):
                invoice_doc.append("advances", {
                    "reference_type": "Payment Entry",
                    "reference_name": row["credit_origin"],
                    "allocated_amount": row["credit_to_redeem"],
                })
                invoice_doc.is_pos = 0
                is_payment_entry = 1

    return is_payment_entry


def set_batch_nos(doc, warehouse_field, throw=False, child_table="items"):
    for d in doc.get(child_table):
        qty = d.get("stock_qty") or d.get("transfer_qty") or d.get("qty") or 0
        warehouse = d.get(warehouse_field, None)
        if warehouse and qty > 0 and frappe.db.get_value("Item", d.item_code, "has_batch_no"):
            if not d.batch_no:
                d.batch_no = get_batch_no(d.item_code, warehouse, qty, throw, d.serial_no)
            else:
                batch_qty = get_batch_qty(batch_no=d.batch_no, warehouse=warehouse)
                if flt(batch_qty, d.precision("qty")) < flt(qty, d.precision("qty")):
                    frappe.throw(
                        _(
                            "Row #{0}: The batch {1} has only {2} qty. Please select another batch which has {3} qty available or split the row into multiple rows, to deliver/issue from multiple batches"
                        ).format(d.idx, d.batch_no, batch_qty, qty)
                    )


def set_batch_nos_for_bundels(doc, warehouse_field, throw=False):
    for d in doc.packed_items:
        qty = d.get("stock_qty") or d.get("transfer_qty") or d.get("qty") or 0
        has_batch_no = frappe.db.get_value("Item", d.item_code, "has_batch_no")
        warehouse = d.get(warehouse_field, None)
        if has_batch_no and warehouse and qty > 0:
            if not d.batch_no:
                d.batch_no = get_batch_no(
                    d.item_code, warehouse, qty, throw, d.serial_no
                )
            else:
                batch_qty = get_batch_qty(batch_no=d.batch_no, warehouse=warehouse)
                if flt(batch_qty, d.precision("qty")) < flt(qty, d.precision("qty")):
                    frappe.throw(
                        _(
                            "Row #{0}: The batch {1} has only {2} qty. Please select another batch which has {3} qty available or split the row into multiple rows, to deliver/issue from multiple batches"
                        ).format(d.idx, d.batch_no, batch_qty, qty)
                    )


def prepare_invoice(invoice_doc, data, invoice=None):
    use_new_fields = frappe.db.get_single_value(
        "Stock Settings", "use_serial_batch_fields"
    )

    if invoice:
        cart_items = {i.get("item_code"): i for i in invoice.get("items", [])}
        for item in invoice_doc.items:
            cart_item = cart_items.get(item.item_code)
            if not cart_item:
                continue

            serial_no = cart_item.get("serial_no")
            batch_no  = cart_item.get("batch_no")
            barcode   = cart_item.get("barcode")

            if use_new_fields:
                if serial_no or batch_no:
                    item.use_serial_batch_fields = 1
                    if serial_no:
                        item.serial_no = serial_no
                    if batch_no:
                        item.batch_no = batch_no
            else:
                if serial_no:
                    item.serial_no = serial_no
                if batch_no:
                    item.batch_no = batch_no

            if barcode:
                item.barcode = barcode

    if frappe.get_value("POS Profile", invoice_doc.pos_profile, "posa_auto_set_batch"):
        set_batch_nos(invoice_doc, "warehouse", throw=True)

    set_batch_nos_for_bundels(invoice_doc, "warehouse", throw=True)

    invoice_doc.update_stock = 1
    invoice_doc.due_date = data.get("due_date")

    invoice_doc.apply_discount_on = invoice.get("apply_discount_on") or "Grand Total"
    invoice_doc.additional_discount_percentage = flt(invoice.get("additional_discount_percentage") or 0)
    invoice_doc.discount_amount = flt(invoice.get("discount_amount") or 0)

    invoice_doc.calculate_taxes_and_totals()
    invoice_doc.flags.ignore_permissions = True
    frappe.flags.ignore_account_permission = True
    invoice_doc.posa_is_printed = 1
    invoice_doc.save()


@frappe.whitelist()
def submit_invoice(invoice, data):
    data = frappe.parse_json(data)
    invoice = frappe.parse_json(invoice)

    if invoice.get("name") and frappe.db.exists("Sales Invoice", invoice.get("name")):
        invoice_doc = frappe.get_doc("Sales Invoice", invoice["name"])
    else:
        invoice_doc = frappe.get_doc(invoice)

    pos = frappe.get_cached_doc("POS Profile", invoice_doc.pos_profile)

    invoice_doc.cost_center        = pos.cost_center
    invoice_doc.taxes_and_charges  = pos.taxes_and_charges
    invoice_doc.selling_price_list = pos.selling_price_list
    invoice_doc.write_off_account  = pos.write_off_account
    invoice_doc.company            = pos.company
    invoice_doc.tax_category       = pos.tax_category

    for item in invoice_doc.items:
        item.cost_center     = pos.cost_center
        item.warehouse       = pos.warehouse
        item.project         = pos.project
        item.expense_account = pos.expense_account

    paid_amount  = flt(invoice.get("summary", {}).get("cash", 0))
    total_amount = flt(invoice.get("summary", {}).get("total", 0))

    credit_change = paid_amount - total_amount
    payment_mode  = invoice.get("paymentMethod") or "Cash"

    allow_partial = frappe.get_value("POS Profile", invoice_doc.pos_profile, "posa_allow_partial_payment")

    if credit_change < 0 and not allow_partial:
        frappe.throw(_("Partial payment is not allowed in the current POS Profile."))

    cash_account = get_cash_account(invoice_doc, payment_mode)

    is_payment_entry = apply_customer_credit(invoice_doc, data)

    prepare_invoice(invoice_doc, data, invoice=invoice)

    return submit_invoice_doc(invoice_doc, data, is_payment_entry, cash_account)


def submit_invoice_doc(invoice_doc, data, is_payment_entry, cash_account):
    allow_background = frappe.get_value(
        "POS Profile",
        invoice_doc.pos_profile,
        "posa_allow_submissions_in_background_job",
    )

    if allow_background:
        job = enqueue(
            method=submit_in_background_job,
            queue="short",
            kwargs={
                "invoice": invoice_doc.name,
                "data": data,
                "is_payment_entry": is_payment_entry,
                "cash_account": cash_account,
            },
        )

        return {
            "success": True,
            "status": "queued",
            "message": "Invoice queued for background submission",
            "invoice": invoice_doc.name,
            "job_id": job.id if job else None,
        }

    invoice_doc.submit()

    return {
        "success": True,
        "status": "submitted",
        "message": "Invoice submitted successfully",
        "invoice": invoice_doc.name,
        "docstatus": invoice_doc.docstatus,
    }


@frappe.whitelist()
def save_invoice(invoice, data):
    data = frappe.parse_json(data)
    invoice = frappe.parse_json(invoice)

    if invoice.get("name") and frappe.db.exists("Sales Invoice", invoice.get("name")):
        invoice_doc = frappe.get_doc("Sales Invoice", invoice["name"])

        if invoice.get("customer"):
            invoice_doc.customer = invoice["customer"]

        if invoice.get("items"):
            existing_items = {row.item_code: row for row in invoice_doc.items}
            for item in invoice.get("items"):
                if item.get("item_code") in existing_items:
                    row = existing_items[item.get("item_code")]
                    row.qty = item.get("qty", 1)
                else:
                    invoice_doc.append("items", item)

        payments = invoice.get("payments", [])
        new_payments = {
            p["mode_of_payment"]: p["amount"]
            for p in payments

        }

        total_paid = sum(new_payments.values())

        if total_paid > invoice_doc.grand_total:
            frappe.throw(
                f"Payment amount ({total_paid}) cannot be greater than invoice grand total ({invoice_doc.grand_total})"
            )

        for row in invoice_doc.payments:
            if row.mode_of_payment in new_payments:
                row.amount = new_payments[row.mode_of_payment]
                del new_payments[row.mode_of_payment]
            else:
                invoice_doc.remove(row)
        for mode, amount in new_payments.items():
            invoice_doc.append("payments", {"mode_of_payment": mode, "amount": amount})

    else:
        invoice_doc = frappe.get_doc(invoice)

    prepare_invoice(invoice_doc, data, invoice=invoice)
    return {"name": invoice_doc.name, "status": invoice_doc.docstatus}


@frappe.whitelist()
def get_draft_invoices(pos_opening_shift):
    invoices_list = frappe.get_list(
        "Sales Invoice",
        filters={
            "posa_pos_opening_shift": pos_opening_shift,
            "docstatus": 0,
            "posa_is_printed": 0,
            "is_pos": 1,
        },
        fields=["name"],
        limit_page_length=0,
        order_by="modified desc",
    )
    data = []
    for invoice in invoices_list:
        data.append(frappe.get_cached_doc("Sales Invoice", invoice["name"]))
    return data


@frappe.whitelist()
def delete_invoice(invoice):
    if frappe.get_value("Sales Invoice", invoice, "posa_is_printed"):
        frappe.throw(_("This invoice {0} cannot be deleted").format(invoice))
    frappe.delete_doc("Sales Invoice", invoice, force=1)
    return _("Invoice {0} Deleted").format(invoice)

@frappe.whitelist()
def create_sales_return(invoice_name: str):
    return_doc = make_return_doc("Sales Invoice", invoice_name)
    return_doc.insert()
    return_doc.submit()
    return return_doc.name


@frappe.whitelist()
def get_returnable_invoices(customer=None, from_date=None, to_date=None, return_days_limit=None):
    filters = {
        "docstatus": 1,
        "is_return": 0,
    }

    if customer:
        filters["customer"] = customer

    if from_date:
        filters["posting_date"] = [">=", from_date]

    if to_date:
        if "posting_date" in filters:
            filters["posting_date"] = ["between", [from_date, to_date]]
        else:
            filters["posting_date"] = ["<=", to_date]

    invoices = frappe.get_all(
        "Sales Invoice",
        filters=filters,
        fields=[
            "name",
            "customer",
            "customer_name",
            "posting_date",
            "grand_total",
            "status",
            "is_pos",
            "posa_pos_opening_shift",
        ],
        order_by="posting_date desc",
    )

    returnable_invoices = []

    for invoice in invoices:
        if return_days_limit:
            invoice_date = getdate(invoice.posting_date)
            max_return_date = add_days(invoice_date, return_days_limit)
            today = getdate(nowdate())

            if today > max_return_date:
                continue

        returnable_qty = get_returnable_qty(invoice.name)

        if not returnable_qty or returnable_qty["total_returnable"] <= 0:
            continue

        if has_full_return(invoice.name):
            continue

        invoice_data = {
            "name": invoice.name,
            "customer": invoice.customer,
            "customer_name": invoice.customer_name,
            "posa_pos_opening_shift": invoice.posa_pos_opening_shift,
            "posting_date": invoice.posting_date,
            "grand_total": invoice.grand_total,
            "status": invoice.status,
            "is_pos": invoice.is_pos,
            "returnable_items": returnable_qty["items"],
            "total_returnable_qty": returnable_qty["total_returnable"],
            "days_since_invoice": (getdate(nowdate()) - getdate(invoice.posting_date)).days,
        }

        returnable_invoices.append(invoice_data)

    return returnable_invoices


def get_returnable_qty(invoice_name):
    original_items = frappe.get_all(
        "Sales Invoice Item",
        filters={"parent": invoice_name},
        fields=["item_code", "item_name", "qty", "rate", "amount", "name"],
    )

    returnable_items = []
    total_returnable = 0

    for item in original_items:
        returned_qty = frappe.db.sql("""
            SELECT SUM(ABS(sii.qty)) as returned_qty
            FROM `tabSales Invoice Item` sii
            INNER JOIN `tabSales Invoice` si ON si.name = sii.parent
            WHERE si.docstatus = 1
                AND si.is_return = 1
                AND si.return_against = %s
                AND sii.item_code = %s
        """, (invoice_name, item.item_code), as_dict=True)

        returned_qty = returned_qty[0].returned_qty if returned_qty and returned_qty[0].returned_qty else 0

        returnable_qty = item.qty - returned_qty

        if returnable_qty > 0:
            returnable_items.append({
                "item_code": item.item_code,
                "item_name": item.item_name,
                "original_qty": item.qty,
                "returned_qty": returned_qty,
                "returnable_qty": returnable_qty,
                "rate": item.rate,
                "amount": item.amount,
            })
            total_returnable += returnable_qty

    return {
        "items": returnable_items,
        "total_returnable": total_returnable,
    }


def has_full_return(invoice_name):
    original_total = frappe.db.sql("""
        SELECT SUM(qty) as total_qty
        FROM `tabSales Invoice Item`
        WHERE parent = %s
    """, invoice_name, as_dict=True)

    original_qty = original_total[0].total_qty if original_total else 0

    returned_total = frappe.db.sql("""
        SELECT SUM(ABS(sii.qty)) as returned_qty
        FROM `tabSales Invoice Item` sii
        INNER JOIN `tabSales Invoice` si ON si.name = sii.parent
        WHERE si.docstatus = 1
            AND si.is_return = 1
            AND si.return_against = %s
    """, invoice_name, as_dict=True)

    returned_qty = returned_total[0].returned_qty if returned_total and returned_total[0].returned_qty else 0

    return returned_qty >= original_qty



@frappe.whitelist()
def get_outstanding_invoices(company, currency, customer=None, pos_profile_name=None):
    if customer:
        precision = frappe.get_precision("Sales Invoice", "outstanding_amount") or 2

        account = get_party_account("Customer", customer, company)
        if not account:
            frappe.logger().warning(f"[get_outstanding_invoices] No receivable account found for customer={customer} company={company}")
            return []

        outstanding_invoices = _get_outstanding_invoices(
            party_type="Customer",
            party=customer,
            account=[account],
        )

        invoices_list = []
        customer_name = frappe.get_cached_value("Customer", customer, "customer_name")

        for invoice in outstanding_invoices:
            if invoice.get("currency") != currency:
                continue

            if pos_profile_name and frappe.get_cached_value(
                "Sales Invoice", invoice.get("voucher_no"), "pos_profile"
            ) != pos_profile_name:
                continue

            outstanding_amount = invoice.get("outstanding_amount", 0)
            if outstanding_amount > 0.5 / (10 ** precision):
                invoices_list.append({
                    "name"              : invoice.get("voucher_no"),
                    "customer"          : customer,
                    "customer_name"     : customer_name,
                    "outstanding_amount": outstanding_amount,
                    "grand_total"       : invoice.get("invoice_amount"),
                    "due_date"          : invoice.get("due_date"),
                    "posting_date"      : invoice.get("posting_date"),
                    "currency"          : invoice.get("currency"),
                    "pos_profile"       : pos_profile_name,
                })

        return invoices_list

    else:
        filters = {
            "company"           : company,
            "outstanding_amount": (">", 0),
            "docstatus"         : 1,
            "is_return"         : 0,
            "currency"          : currency,
        }
        if pos_profile_name:
            filters["pos_profile"] = pos_profile_name

        return frappe.get_all(
            "Sales Invoice",
            filters=filters,
            fields=[
                "name", "customer", "customer_name",
                "outstanding_amount", "grand_total",
                "due_date", "posting_date", "currency", "pos_profile",
            ],
            order_by="due_date asc",
        )
