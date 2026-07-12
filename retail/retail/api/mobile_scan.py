
# retail/retail/api/mobile_scan.py
# ─────────────────────────────────────────────────────────────────────────────
# Mobile barcode scan receiver.
# Mobile sends barcode here → we publish_realtime to the POS desktop session.
#
# KEY FIX: publish_realtime WITHOUT user= param so it broadcasts to the
# session room, not a specific user. This works whether the mobile is
# Guest or authenticated.
# ─────────────────────────────────────────────────────────────────────────────


# retail/retail/api/mobile_scan.py
import frappe

@frappe.whitelist(allow_guest=True)
def receive_barcode(session_id: str, barcode: str):
    if not session_id or not barcode:
        return {"found": False, "error": "Missing params"}

    barcode = barcode.strip()

    # Get Item via Barcode
    item_code = frappe.db.get_value("Item Barcode", {"barcode": barcode}, "parent")

    if not item_code:
        # Fallback: check if the barcode is actually the item_code itself
        if frappe.db.exists("Item", barcode):
            item_code = barcode
        else:
            return {"found": False, "barcode": barcode}

    item_name = frappe.db.get_value("Item", item_code, "item_name")

    payload = {
        "barcode": barcode,
        "found": True,
        "item_code": item_code,
        "item_name": item_name,
        "session_id": session_id
    }

    frappe.utils.logger.set_log_level("DEBUG")

    barcode_logger = frappe.logger("barcode_scan", allow_site=True, file_count=50)

    barcode_logger.info(f"SESSION SENT: {session_id} | BARCODE: {barcode} | ITEM: {item_code} - {item_name}")

    frappe.publish_realtime(
        event=f"barcode_scan_{session_id}",
        message=payload,
        user = frappe.session.user,
        after_commit=True,
        )
    barcode_logger.info("AFTER PUBLISH")
    return payload
