import frappe
from frappe.utils import nowdate

def apply_pricing_rules_for_pos(items, customer, customer_group, company, price_list, currency,
                                 transaction_date):
    """
    تطبيق قواعد التسعير على المنتج في نقطة البيع
    """
    from erpnext.accounts.doctype.pricing_rule.pricing_rule import apply_pricing_rule

    args = {
            "items": items,
            "customer": customer,
            "customer_group": customer_group,
            "territory": frappe.db.get_value("Customer", customer, "territory"),
            "supplier": None,
            "supplier_group": None,
            "campaign": None,
            "sales_partner": None,
            "doctype": "Sales Invoice",
            "transaction_type": "selling",
            "price_list": price_list,
            "company": company,
            "currency": currency,
            "conversion_rate": 1,
            "transaction_date": transaction_date,
            "plc_conversion_rate": 1,
            "ignore_pricing_rule": 0,
        }
    try:
        pricing_rule_details = apply_pricing_rule(args, doc=None)

        return pricing_rule_details

    except Exception as e:
        frappe.log_error(f"Error applying pricing rule: {str(e)}")

    return
