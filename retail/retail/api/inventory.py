import frappe
from frappe import _
from frappe.utils import now, nowdate
import qrcode
from io import BytesIO
import base64
from frappe.model.naming import NamingSeries, get_default_naming_series
from frappe.client import get_value
from frappe.utils.file_manager import save_file

@frappe.whitelist()
def generate_barcode_value(barcode_type):
    import random

    t = barcode_type.upper().replace("-", "").replace(" ", "")

    def gen_ean(length):
        base = [random.randint(0, 9) for _ in range(length - 1)]
        total = sum(d * (1 if i % 2 == 0 else 3) for i, d in enumerate(base))
        check = (10 - (total % 10)) % 10
        return ''.join(str(d) for d in base) + str(check)

    def gen_upc():
        base = [random.randint(0, 9) for _ in range(11)]
        total = sum(d * (3 if i % 2 == 0 else 1) for i, d in enumerate(base))
        check = (10 - (total % 10)) % 10
        return ''.join(str(d) for d in base) + str(check)

    def gen_isbn13():
        prefix = [9, 7, 8]
        middle = [random.randint(0, 9) for _ in range(9)]
        base = prefix + middle
        total = sum(d * (1 if i % 2 == 0 else 3) for i, d in enumerate(base))
        check = (10 - (total % 10)) % 10
        return ''.join(str(d) for d in base) + str(check)

    def gen_isbn10():
        digits = [random.randint(0, 9) for _ in range(9)]
        total = sum((i + 1) * d for i, d in enumerate(digits))
        check = total % 11
        return ''.join([str(d) for d in digits]) + ('X' if check == 10 else str(check))

    def gen_issn():
        digits = [random.randint(0, 9) for _ in range(7)]
        total = sum((8 - i) * d for i, d in enumerate(digits))
        check = (11 - (total % 11)) % 11
        return ''.join([str(d) for d in digits]) + ('X' if check == 10 else str(check))

    def gen_pzn():
        digits = [random.randint(0, 9) for _ in range(7)]
        total = sum((i + 2) * d for i, d in enumerate(digits))
        check = total % 11
        if check == 10:
            return gen_pzn()
        return ''.join([str(d) for d in digits]) + str(check)

    def gen_code():
        chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        return ''.join([chars[random.randint(0, len(chars) - 1)] for _ in range(10)])

    def gen_qr():
        import uuid
        return str(uuid.uuid4())

    generators = {
        'EAN':    lambda: gen_ean(13),
        'EAN13':  lambda: gen_ean(13),
        'EAN12':  lambda: gen_ean(12),
        'EAN8':   lambda: gen_ean(8),
        'JAN':    lambda: gen_ean(13),
        'UPCA':   gen_upc,
        'UPC':    gen_upc,
        'GS1':    lambda: gen_ean(13),
        'GTIN':   lambda: gen_ean(14),
        'ISBN':   gen_isbn13,
        'ISBN10': gen_isbn10,
        'ISBN13': gen_isbn13,
        'ISSN':   gen_issn,
        'PZN':    gen_pzn,
        'CODE39': gen_code,
        'CODE128':gen_code,
        'QR':      gen_qr,
    }

    gen = generators.get(t)
    if not gen:
        frappe.throw(f"Barcode type '{barcode_type}' is not supported")

    value = gen()
    return {'status': 'success', 'value': value}

def normalize_barcode_type(t):
    return (t or "").upper().replace("-", "").replace(" ", "")

@frappe.whitelist()
def get_barcode_types():
    try:
        meta = frappe.get_meta('Item Barcode')
        barcode_type_field = next(
            (f for f in meta.fields if f.fieldname == 'barcode_type'),
            None
        )
        if not barcode_type_field or not barcode_type_field.options:
            return {'status': 'success', 'data': []}

        types = [t.strip() for t in barcode_type_field.options.split('\n') if t.strip()]
        return {'status': 'success', 'data': types}

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_barcode_types Error')
        return {'status': 'error', 'message': str(e), 'data': []}


@frappe.whitelist()
def get_default_item_series():
    series = get_default_naming_series("Item")
    return series


@frappe.whitelist()
def get_all_barcodes(items=None):
    """
    Return Products with their barcodes + preview image.
    barcode_list = [barcode, barcode_type, uom, preview]
    """
    try:

        products_list = []
        for idx, item in enumerate(items, 1):

            barcodes_raw = item.get("item_barcode")
            barcode_list = []
            for bc in barcodes_raw:
                barcode_value = bc.get('barcode') or ''
                barcode_type  = bc.get('barcode_type') or ''

                preview = ''
                if barcode_value:
                    preview = generate_barcode_image_base64(barcode_value, barcode_type)

                barcode_list.append({
                    'barcode':      barcode_value,
                    'barcode_type': barcode_type,
                    'uom':          bc.get('uom', ''),
                    'preview':      preview,
                })

            product_data = {
                'id':           idx,
                'sku':          item.get('item_code'),
                'productName':  item.get('item_name'),
                'productImage': item.get('image', ''),
                'productId':    item.get('name', ''),
                'item_group':   item.get('item_group') or '',
                'status':       'inactive' if item.get("disabled") else 'active',
                'creation':     str(item.get('creation', '')),
                'barcodes':     barcode_list,
            }
            products_list.append(product_data)

        return {
            'status': 'success',
            'data':   products_list,
            'total':  len(products_list)
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_all_barcodes Error')
        return {'status': 'error', 'message': str(e)}

def generate_barcode_image_base64(barcode_value, barcode_type=''):
    try:
        import barcode as python_barcode
        from barcode.writer import ImageWriter

        type_map = {
            'EAN':    'ean13',
            'EAN13':  'ean13',
            'EAN8':   'ean8',
            'UPC-A':  'upca',
            'UPCA':   'upca',
            'CODE39': 'code39',
            'CODE128':'code128',
            'ISBN':   'isbn13',
            'ISBN13': 'isbn13',
            'ISBN10': 'isbn10',
            'ISSN':   'issn',
            'JAN':    'jan',
            'PZN':    'pzn',
        }

        if barcode_type.upper() in ('QR', 'QRCODE', 'QR CODE'):
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=6,
                border=2,
            )
            qr.add_data(barcode_value)
            qr.make(fit=True)
            img = qr.make_image(fill_color='black', back_color='white')
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            return 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode()

        # Standard barcodes
        t = normalize_barcode_type(barcode_type)
        bc_type = type_map.get(t, 'code128')
        BarcodeClass = python_barcode.get_barcode_class(bc_type)

        buffer = BytesIO()
        bc = BarcodeClass(str(barcode_value), writer=ImageWriter())
        bc.write(buffer, options={
                'write_text':    True,
                'quiet_zone':    6,
                'font_size':     12,
                'text_distance': 5,
                'module_height': 15.0,
                'module_width':  0.38,
                'background':    'white',
                'foreground':    'black',
        })
        buffer.seek(0)
        return 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode()

    except Exception as e:
        frappe.log_error(f"Barcode preview failed for '{barcode_value}' ({barcode_type}): {e}")
        return ''

@frappe.whitelist()
def get_item_barcodes(item_code):
    """
    Fetch all barcodes for an item.
    """
    try:
        item_doc = frappe.get_doc('Item', item_code)

        barcodes_list = []
        if item_doc.barcodes:
            for barcode in item_doc.barcodes:
                barcodes_list.append({
                    'idx': barcode.idx,  # رقم الصف
                    'barcode': barcode.barcode,
                    'barcode_type': barcode.barcode_type,
                    'item_code': item_code,
                    'item_name': item_doc.item_name,
                    'parent': item_code,
                    'parenttype': 'Item',
                    'parentfield': 'barcodes',
                })

        return {
            'status': 'success',
            'data': barcodes_list
        }

    except frappe.DoesNotExistError:
        return {
            'status': 'error',
            'message': _('Item not found')
        }
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Get Item Barcodes Error')
        return {
            'status': 'error',
            'message': str(e)
        }

@frappe.whitelist()
def update_item_barcode(item_code, old_barcode, barcode_data):
    """
    Update a single barcode in an Item document.
    Looks up the row by the OLD barcode value (not row index).
    Returns an error if the new barcode already exists on another item.
    """
    try:
        if isinstance(barcode_data, str):
            barcode_data = frappe.parse_json(barcode_data)

        new_barcode_value = barcode_data.get('barcode', old_barcode)

        # ── Uniqueness check ──────────────────────────────────────
        # If the barcode value is actually changing, make sure it
        # doesn't already exist on ANY other item.
        if new_barcode_value != old_barcode:
            duplicate = frappe.db.exists(
                'Item Barcode',
                {
                    'barcode': new_barcode_value,
                    'parent': ['!=', item_code]
                }
            )
            if duplicate:
                return {
                    'status': 'error',
                    'message': _(
                        'Barcode {0} already exists on another item. '
                        'Barcode must be unique.'
                    ).format(new_barcode_value)
                }

        item_doc = frappe.get_doc('Item', item_code)

        barcode_row = next(
            (row for row in item_doc.barcodes if row.barcode == old_barcode),
            None
        )

        if not barcode_row:
            return {
                'status': 'error',
                'message': _('Barcode {0} not found on item {1}').format(
                    old_barcode, item_code
                )
            }

        if 'barcode' in barcode_data:
            barcode_row.barcode = barcode_data['barcode']
        if 'barcode_type' in barcode_data:
            barcode_row.barcode_type = barcode_data['barcode_type']
        if 'uom' in barcode_data:
            barcode_row.uom = barcode_data['uom']

        item_doc.save()
        frappe.db.commit()

        return {
            'status': 'success',
            'message': _('Barcode updated successfully'),
            'data': {
                'barcode':      barcode_row.barcode,
                'barcode_type': barcode_row.barcode_type,
                'uom':          barcode_row.uom,
            }
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Update Item Barcode Error')
        return {
            'status': 'error',
            'message': str(e)
        }


@frappe.whitelist()
def add_item_barcode(barcode_data):
    try:
        item_doc = frappe.get_doc('Item',barcode_data.get('item_code'))
        new_barcode = {
            'barcode': barcode_data.get('value'),
            'barcode_type': barcode_data.get('type', 'CODE128'),
            'posa_uom': barcode_data.get('uom'),
            'uom': barcode_data.get('uom'),
        }

        item_doc.append('barcodes', new_barcode)
        item_doc.save()

        new_row = item_doc.barcodes[-1]
        if new_row:
            preview = generate_barcode_image_base64(barcode_data.get('value'), barcode_data.get('type'))
            if preview:
                return {
                    'status': 'success',
                    'message': _('Barcode added successfully'),
                    'data': {
                        'idx': new_row.idx,
                        'barcode': new_row.barcode,
                        'barcode_type': new_row.barcode_type,
                        'posa_uom': new_row.uom,
                        'uom': new_row.uom,
                        'image': preview
                    }
                }
            else:
                return {
                        'status': 'error',
                        'message': _('Barcode failed generated'),
                        'data': {}
                    }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Add Item Barcode Error')
        return {
            'status': 'error',
            'message': str(e)
        }


@frappe.whitelist()
def delete_item_barcode(item_code, barcode):
    """
    Delete a barcode from an item.
    """
    try:
        item_doc = frappe.get_doc('Item', item_code)

        rows_to_remove = [
            idx for idx, row in enumerate(item_doc.barcodes)
            if row.barcode == barcode
        ]

        if not rows_to_remove:
            return {
                'status': 'error',
                'message': _('Barcode not found')
            }

        # حذف من الخلف للأمام لتجنب مشاكل الـ indexing
        for idx in reversed(rows_to_remove):
            del item_doc.barcodes[idx]

        item_doc.save()

        return {
            'status': 'success',
            'message': _('Barcode deleted successfully')
        }

    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }


    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Delete Item Barcode Error')
        return {
            'status': 'error',
            'message': str(e)
        }

@frappe.whitelist()
def bulk_update_item_barcodes(item_code, barcodes_data):
    """
    Update multiple barcodes for an item.
    """
    try:
        item_doc = frappe.get_doc('Item', item_code)

        results = {
            'success': [],
            'failed': []
        }

        for barcode_update in barcodes_data:
            try:
                row_index = barcode_update.get('idx')
                barcode_row = None

                for row in item_doc.barcodes:
                    if row.idx == row_index:
                        barcode_row = row
                        break

                if not barcode_row:
                    results['failed'].append({
                        'idx': row_index,
                        'error': 'Row not found'
                    })
                    continue

                # تحديث الحقول
                for key, value in barcode_update.items():
                    if key != 'idx' and hasattr(barcode_row, key):
                        setattr(barcode_row, key, value)

                results['success'].append({
                    'idx': barcode_row.idx,
                    'barcode': barcode_row.barcode,
                    'barcode_type': barcode_row.barcode_type
                })

            except Exception as e:
                results['failed'].append({
                    'idx': barcode_update.get('idx'),
                    'error': str(e)
                })

        item_doc.save()

        return {
            'status': 'success',
            'successful_updates': len(results['success']),
            'failed_updates': len(results['failed']),
            'data': results
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Bulk Update Item Barcodes Error')
        return {
            'status': 'error',
            'message': str(e)
        }

def generate_barcode_svg(barcode_value, barcode_type):
    """Generate an SVG for a barcode."""
    try:
        if barcode_type == 'QR':
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(barcode_value)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
        else:
            # يمكن تحسين هذا لأنواع أخرى
            img = qrcode.QRCode()
            img.add_data(barcode_value)
            img.make()
            img = img.make_image()

        # تحويل للـ base64 SVG (مبسط)
        svg = f'<svg width="100" height="100"><text x="10" y="50">{barcode_value}</text></svg>'
        return svg

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'generate_barcode_svg Error')
        return '<svg></svg>'



@frappe.whitelist()
def generate_barcode_img(barcode_value, barcode_type):
    try:
        if not barcode_value:
            return {
                'status': 'error',
                'message': 'Barcode value is empty',
                'data': ''
            }

        barcode_type_clean = (barcode_type or '').upper().strip()

        # ✅ QR
        if barcode_type_clean in ('QR', 'QRCODE'):
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(barcode_value)
            qr.make(fit=True)

            img = qr.make_image(fill_color="black", back_color="white")

            buffer = BytesIO()
            img.save(buffer, format="PNG")

            base64_img = base64.b64encode(buffer.getvalue()).decode()

            return {
                'status': 'success',
                'data': f'data:image/png;base64,{base64_img}'
            }

        preview = generate_barcode_image_base64(barcode_value, barcode_type_clean)

        return {
            'status': 'success',
            'data': preview
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'generate_barcode_img Error')
        return {
            'status': 'error',
            'message': str(e),
            'data': ''
        }

def clear_posa_cache():
    """مسح جميع cache keys المتعلقة بـ POS Items"""
    try:
        # الطريقة الصحيحة للوصول لـ Redis client
        redis_client = frappe.cache()

        # البحث عن جميع keys المتعلقة بـ get_items
        keys = redis_client.keys("*__get_items*") or []

        if keys:
            # حذف جميع الـ keys
            redis_client.delete(*keys)
            frappe.logger().info(f"Cleared {len(keys)} cache keys")

        # أيضاً مسح Item cache
        frappe.cache().delete_value("Item")

    except Exception as e:
        frappe.logger().warning(f"Cache clearing error: {e}")


@frappe.whitelist()
def delete_item(item_code):
    """
    Delete an item and clear the cache.
    """
    try:
        # التحقق من وجود الـ Item
        if not frappe.db.exists("Item", item_code):
            return {"status": "error", "message": f"Item {item_code} does not exist"}

        item_doc = frappe.get_doc("Item", item_code)
        item_doc.delete(ignore_permissions=True)

        frappe.db.commit()
        clear_posa_cache()

        return {
            "status": "success",
            "message": f"Item {item_code} deleted successfully"
        }

    except frappe.DoesNotExistError:
        return {"status": "error", "message": f"Item {item_code} not found"}
    except Exception as e:
        frappe.logger().error(f"Error deleting item: {e}")
        return {"status": "error", "message": str(e)}

def handle_item_image(image_data, item_code):
    """Handle the item image and create a File document."""
    try:

        if isinstance(image_data, str) and image_data.startswith('/files/'):
            return image_data

        if isinstance(image_data, str) and image_data.startswith('data:image'):

            header, encoded = image_data.split(',', 1)
            image_bytes = base64.b64decode(encoded)

            file_type = header.split(';')[0].replace('data:image/', '')
            if file_type == 'jpeg':
                file_type = 'jpg'

            file_name = f"{item_code}.{file_type}"
            file_doc = save_file(
                fname=file_name,
                content=image_bytes,
                dt="Item",
                dn=item_code,
                is_private=0
            )
            return file_doc.file_url

        return None

    except Exception as e:
        frappe.logger().error(f"Error handling image: {e}")
        return None


def clear_posa_cache():
    """Clear the POS cache."""
    try:
        frappe.cache().delete_key("posa_items")
        frappe.cache().delete_key("posa_categories")
    except:
        pass


@frappe.whitelist()
def update_item(item_code, item_data):
    """Update an item and clear the cache."""
    try:
        if isinstance(item_data, str):
            item_data = frappe.parse_json(item_data)

        item_doc = frappe.get_doc("Item", item_code)

        image_url = None
        if "image" in item_data and item_data["image"]:
            image_url = handle_item_image(item_data["image"], item_code)
            if image_url:
                item_data["image"] = image_url

        for key, value in item_data.items():

            if value is None or value == "":
                continue

            if hasattr(item_doc, key) or key in item_doc.fields_dict:
                setattr(item_doc, key, value)
            else:
                frappe.logger().warning(f"Field {key} does not exist in Item doctype")

        item_doc.save(ignore_permissions=True)
        frappe.db.commit()

        clear_posa_cache()

        return {
            "status": "success",
            "message": f"Item {item_code} updated successfully",
            "data": item_doc.as_dict()
        }

    except frappe.DoesNotExistError:
        frappe.logger().error(f"Item {item_code} not found")
        return {
            "status": "error",
            "message": f"Item {item_code} not found"
        }

    except frappe.ValidationError as e:
        frappe.logger().error(f"Validation error updating item: {e}")
        return {
            "status": "error",
            "message": f"Validation error: {str(e)}"
        }

    except Exception as e:
        frappe.logger().error(f"Error updating item: {e}")
        frappe.db.rollback()
        return {
            "status": "error",
            "message": str(e)
        }

def generate_item_code():
    year = nowdate().split('-')[0]

    last_item = frappe.db.sql("""
        SELECT name FROM `tabItem`
        WHERE name REGEXP %s
        ORDER BY CAST(SUBSTRING_INDEX(name, '-', -1) AS UNSIGNED) DESC
        LIMIT 1
    """, (f'^STO-ITEM-{year}-[0-9]+$',), as_dict=True)

    if last_item:
        try:
            last_num = int(last_item[0]['name'].split('-')[-1])
            next_num = last_num + 1
        except (ValueError, IndexError):
            next_num = 1
    else:
        next_num = 1

    return f'STO-ITEM-{year}-{str(next_num).zfill(5)}'

@frappe.whitelist()
def add_item(item_data):
    try:
        if isinstance(item_data, str):
            item_data = frappe.parse_json(item_data)

        required_fields = ["item_name", "item_group"]
        for field in required_fields:
            if field not in item_data:
                return {"status": "error", "message": f"Required field missing: {field}"}

        max_retries = 5
        item_code = None

        for attempt in range(max_retries):
            item_code = generate_item_code()

            if not frappe.db.exists("Item", item_code):
                break

            if attempt == max_retries - 1:
                return {"status": "error", "message": "Could not generate unique item code"}

        image_path = None
        if item_data.get("image"):
            image_path = handle_item_image(item_data.get("image"), item_code)
            item_data["image"] = image_path if image_path else item_data.pop("image", None)

        item_data.pop("naming_series", None)

        item_doc = frappe.get_doc({
            "doctype": "Item",
            **item_data,
            "item_code": item_code,
            "has_serial_no": 0,
        })

        item_doc.name = item_code
        item_doc.flags.name_set = True

        item_doc.insert(ignore_permissions=True)


        clear_posa_cache()
        return {
            "status": "success",
            "message": f"Item {item_doc.item_code} added successfully",
            "item_code": item_doc.item_code,
            "item": item_doc.as_dict(),
            "image": image_path
        }

    except frappe.DuplicateEntryError:
        frappe.db.rollback()
        return {"status": "error", "message": "Item already exists"}
    except frappe.ValidationError as e:
        frappe.db.rollback()
        return {"status": "error", "message": f"Validation error: {str(e)}"}
    except Exception as e:
        frappe.db.rollback()
        frappe.logger().error(f"Error adding item: {e}")
        return {"status": "error", "message": str(e)}
