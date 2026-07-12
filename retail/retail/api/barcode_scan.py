
import frappe
import base64
import io

try:
    from PIL import Image, ImageEnhance, ImageFilter
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    from pyzbar import pyzbar
    PYZBAR_AVAILABLE = True
except ImportError:
    PYZBAR_AVAILABLE = False

try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

@frappe.whitelist(allow_guest=False)
def decode_barcode(image_data: str, enhance: bool = True):
    """
    Decode barcode from a base64 image.

    Args:
        image_data: base64 encoded image (with or without data:image/... prefix)
        enhance:    whether to apply image enhancement before decoding

    Returns:
        {
            "success": True,
            "barcode": "1234567890",
            "format":  "EAN13",
            "method":  "pyzbar" | "opencv"
        }
        or
        {
            "success": False,
            "error": "reason"
        }
    """
    if not PIL_AVAILABLE:
        return _error("PIL (Pillow) not installed. Run: bench pip install pillow")

    if not PYZBAR_AVAILABLE and not CV2_AVAILABLE:
        return _error("No barcode library installed. Run: bench pip install pyzbar opencv-python-headless")

    # ── Decode base64 → PIL Image ────────────────────────────────
    try:
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]

        img_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception as e:
        return _error(f"Failed to decode image: {str(e)}")

    if PYZBAR_AVAILABLE:
        result = _try_pyzbar(img)
        if result:
            return _success(result, "pyzbar_original")

    if CV2_AVAILABLE and PYZBAR_AVAILABLE and enhance:
        for method_name, processed in _cv2_variants(img):
            result = _try_pyzbar(processed)
            if result:
                return _success(result, f"pyzbar_{method_name}")

    if PYZBAR_AVAILABLE and enhance:
        for method_name, processed in _pil_variants(img):
            result = _try_pyzbar(processed)
            if result:
                return _success(result, f"pyzbar_{method_name}")

    if CV2_AVAILABLE:
        result = _try_opencv(img)
        if result:
            return _success(result, "opencv")

    return _error("No barcode found in image")

def _try_pyzbar(img: "Image.Image"):
    """Try to decode barcodes using pyzbar. Returns first result or None."""
    try:
        decoded = pyzbar.decode(img)
        if decoded:
            d = decoded[0]
            return {
                "barcode": d.data.decode("utf-8"),
                "format":  d.type,   # EAN13, CODE128, QRCODE, etc.
            }
    except Exception:
        pass
    return None

def _try_opencv(img: "Image.Image"):
    """Try OpenCV barcode/QR detector."""
    try:
        arr = np.array(img)
        gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)

        # QR Code detector
        qr = cv2.QRCodeDetector()
        data, _, _ = qr.detectAndDecode(gray)
        if data:
            return {"barcode": data, "format": "QRCODE"}

        # Barcode detector (OpenCV 4.8+)
        if hasattr(cv2, "barcode"):
            bd = cv2.barcode.BarcodeDetector()
            ok, decoded_info, decoded_type, _ = bd.detectAndDecode(gray)
            if ok and decoded_info:
                return {"barcode": decoded_info[0], "format": decoded_type[0]}

    except Exception:
        pass
    return None

def _pil_variants(img: "Image.Image"):
    """Yield (name, processed_image) for PIL-based enhancements."""
    # Grayscale
    gray = img.convert("L")
    yield "gray", gray

    # High contrast
    enhancer = ImageEnhance.Contrast(gray)
    yield "high_contrast", enhancer.enhance(2.5)

    # Sharpened
    yield "sharp", gray.filter(ImageFilter.SHARPEN)

    # Upscaled (helps with small/blurry barcodes)
    w, h = img.size
    if w < 800:
        big = img.resize((w * 2, h * 2), Image.LANCZOS)
        yield "upscaled", big.convert("L")


def _cv2_variants(img: "Image.Image"):
    """Yield (name, processed_PIL_image) for OpenCV-based enhancements."""
    try:
        arr = np.array(img)
        gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)

        # Adaptive threshold — great for uneven lighting
        thresh = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )
        yield "adaptive_thresh", Image.fromarray(thresh)

        # CLAHE — contrast limited adaptive histogram equalization
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        clahe_img = clahe.apply(gray)
        yield "clahe", Image.fromarray(clahe_img)

        # Sharpening kernel
        kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
        sharpened = cv2.filter2D(gray, -1, kernel)
        yield "kernel_sharp", Image.fromarray(sharpened)

        # Bilateral filter — removes noise, keeps edges
        bilateral = cv2.bilateralFilter(gray, 9, 75, 75)
        yield "bilateral", Image.fromarray(bilateral)

    except Exception:
        pass

def _success(result: dict, method: str):
    return {
        "success": True,
        "barcode": result["barcode"],
        "format":  result.get("format", "UNKNOWN"),
        "method":  method,
    }

def _error(msg: str):
    return {
        "success": False,
        "error":   msg,
    }

@frappe.whitelist(allow_guest=False)
def check_dependencies():
    """Check which barcode libraries are available."""
    return {
        "pyzbar":   PYZBAR_AVAILABLE,
        "opencv":   CV2_AVAILABLE,
        "pillow":   PIL_AVAILABLE,
        "ready":    PIL_AVAILABLE and (PYZBAR_AVAILABLE or CV2_AVAILABLE),
    }
