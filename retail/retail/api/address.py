import frappe
from frappe import _
from frappe.contacts.doctype.address.address import get_preferred_address, get_condensed_address


def get_party_address_info(doctype, party_name, preferred_key='is_primary_address'):
    if not doctype or not party_name:
        return {}
    if preferred_key not in ['is_shipping_address', 'is_primary_address']:
        frappe.throw(_('Invalid preferred_key value'))
    address_name = get_preferred_address(doctype, party_name, preferred_key=preferred_key)
    if address_name:
        return frappe.get_doc('Address', address_name).as_dict()
    return {}

def _address_dict(addr_doc) -> dict:
    return {
        "name": addr_doc.name,
        "address_title": addr_doc.address_title,
        "address_line1": addr_doc.address_line1,
        "address_line2": addr_doc.address_line2,
        "city": addr_doc.city,
        "state": addr_doc.state,
        "country": addr_doc.country,
        "pincode": addr_doc.pincode,
        "is_primary_address": addr_doc.is_primary_address,
        "is_shipping_address": addr_doc.is_shipping_address,
        "condensed": get_condensed_address(addr_doc),
    }

@frappe.whitelist(allow_guest=False)
def create_address(customer, title, line1, city,
                   line2=None, state=None, country=None, pincode=None,
                   is_primary_address=0, is_shipping_address=0):
    doc = frappe.new_doc("Address")
    doc.address_title = title
    doc.address_line1 = line1
    doc.address_line2 = line2 or ""
    doc.city = city
    doc.state = state or ""
    doc.country = country or "Egypt"
    doc.pincode = pincode or ""
    doc.is_primary_address = int(is_primary_address or 0)
    doc.is_shipping_address = int(is_shipping_address or 0)
    doc.append("links", {"link_doctype": "Customer", "link_name": customer})
    doc.insert(ignore_permissions=False)
    return _address_dict(doc)

@frappe.whitelist(allow_guest=False)
def update_address(address_name, title=None, line1=None, line2=None,
                   city=None, state=None, country=None, pincode=None,
                   is_primary_address=None, is_shipping_address=None):
    doc = frappe.get_doc("Address", address_name)
    if title is not None: doc.address_title = title
    if line1 is not None: doc.address_line1 = line1
    if line2 is not None: doc.address_line2 = line2
    if city is not None: doc.city = city
    if state is not None: doc.state = state
    if country is not None: doc.country = country
    if pincode is not None: doc.pincode = pincode
    if is_primary_address is not None: doc.is_primary_address = int(is_primary_address)
    if is_shipping_address is not None: doc.is_shipping_address = int(is_shipping_address)
    doc.save(ignore_permissions=False)
    return _address_dict(doc)

@frappe.whitelist()
def get_customer_addresses(customer):
    return frappe.db.sql(
        """
        SELECT
            address.name,
            address.address_line1,
            address.address_line2,
            address.address_title,
            address.city,
            address.state,
            address.country,
            address.address_type
        FROM `tabAddress` as address
        INNER JOIN `tabDynamic Link` AS link ON address.name = link.parent
        WHERE link.link_doctype = 'Customer'
            AND link.link_name = %s
            AND address.disabled = 0
        ORDER BY address.name
        """,
        (customer,),
        as_dict=1,
    )
