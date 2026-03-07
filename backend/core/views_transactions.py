import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ValidationError

from .services_transactions import (
    create_transaction_for_user,
    list_transactions_for_user,
    get_transaction_for_user,
    update_transaction_for_user,
    delete_transaction_for_user,
)


def _require_login(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "login required"}, status=401)
    return None


@csrf_exempt
def transactions_collection(request):

    err = _require_login(request)
    if err:
        return err

    if request.method == "GET":
        txs = list_transactions_for_user(request.user)
        data = []
        for tx in txs:
            data.append({
                "id": tx.id,
                "amount": str(tx.amount),
                "trans_date": tx.trans_date.isoformat(),
                "note": tx.note,
                "account": {"id": tx.account.id, "name": tx.account.name},
                "category": {"id": tx.category.id, "name": tx.category.name, "type": tx.category.category_type},
            })
        return JsonResponse({"results": data})

    if request.method == "POST":
        try:
            payload = json.loads(request.body)
            tx = create_transaction_for_user(request.user, payload)
            return JsonResponse({"status": "success", "transaction_id": tx.id})
        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "method not allowed"}, status=405)


@csrf_exempt
def transactions_item(request, tx_id):

    err = _require_login(request)
    if err:
        return err

    if request.method == "GET":
        tx = get_transaction_for_user(request.user, tx_id)
        if not tx:
            return JsonResponse({"error": "not found"}, status=404)

        return JsonResponse({
            "id": tx.id,
            "amount": str(tx.amount),
            "trans_date": tx.trans_date.isoformat(),
            "note": tx.note,
            "account_id": tx.account.id,
            "category_id": tx.category.id,
        })

    if request.method in ("PUT", "PATCH"):
        try:
            payload = json.loads(request.body)
            tx = update_transaction_for_user(request.user, tx_id, payload)
            if not tx:
                return JsonResponse({"error": "not found"}, status=404)
            return JsonResponse({"status": "success"})
        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

    if request.method == "DELETE":
        ok = delete_transaction_for_user(request.user, tx_id)
        if not ok:
            return JsonResponse({"error": "not found"}, status=404)
        return JsonResponse({"status": "deleted"})

    return JsonResponse({"error": "method not allowed"}, status=405)