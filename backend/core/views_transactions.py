import json

from django.core.exceptions import ValidationError
from django.core.paginator import EmptyPage, Paginator
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .services_transactions import (
    create_transaction_for_user,
    delete_transaction_for_user,
    get_transaction_for_user,
    list_transactions_for_user,
    update_transaction_for_user,
)


def _require_login(request):
    """
    Ensure the request is authenticated.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "login required"}, status=401)
    return None


@csrf_exempt
def transactions_collection(request):
    """
    Transaction collection endpoint.

    Supported methods:
    - GET: list transactions with optional filtering and pagination
    - POST: create a new transaction
    """
    auth_error = _require_login(request)
    if auth_error:
        return auth_error

    if request.method == "GET":
        account_id = request.GET.get("account_id")
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("page_size", 10))

        # Limit page size to prevent very large responses
        page_size = min(page_size, 50)

        transactions_qs = list_transactions_for_user(
            request.user,
            account_id=account_id,
        )

        paginator = Paginator(transactions_qs, page_size)

        try:
            page_obj = paginator.page(page)
        except EmptyPage:
            return JsonResponse({
                "results": [],
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total_pages": paginator.num_pages,
                    "total_items": paginator.count,
                    "has_next": False,
                    "has_previous": False,
                }
            })

        results = []
        for tx in page_obj.object_list:
            results.append({
                "id": tx.id,
                "amount": str(tx.amount),
                "trans_date": tx.trans_date.isoformat(),
                "note": tx.note,
                "account": {
                    "id": tx.account.id,
                    "name": tx.account.name,
                    "account_type": tx.account.account_type,
                    "balance": str(tx.account.balance),
                },
                "category": {
                    "id": tx.category.id,
                    "name": tx.category.name,
                    "category_type": tx.category.category_type,
                },
            })

        return JsonResponse({
            "results": results,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_pages": paginator.num_pages,
                "total_items": paginator.count,
                "has_next": page_obj.has_next(),
                "has_previous": page_obj.has_previous(),
            }
        })

    if request.method == "POST":
        try:
            data = json.loads(request.body)
            tx = create_transaction_for_user(request.user, data)

            return JsonResponse({
                "status": "success",
                "transaction_id": tx.id,
            })

        except json.JSONDecodeError:
            return JsonResponse({"error": "invalid JSON"}, status=400)

        except ValidationError as e:
            return JsonResponse({"error": e.message}, status=400)

    return JsonResponse({"error": "method not allowed"}, status=405)


@csrf_exempt
def transactions_item(request, tx_id):
    """
    Single transaction endpoint.

    Supported methods:
    - GET: retrieve transaction detail
    - PUT / PATCH: update transaction
    - DELETE: delete transaction
    """
    auth_error = _require_login(request)
    if auth_error:
        return auth_error

    if request.method == "GET":
        tx = get_transaction_for_user(request.user, tx_id)

        if not tx:
            return JsonResponse({"error": "not found"}, status=404)

        return JsonResponse({
            "id": tx.id,
            "amount": str(tx.amount),
            "trans_date": tx.trans_date.isoformat(),
            "note": tx.note,
            "account": {
                "id": tx.account.id,
                "name": tx.account.name,
                "account_type": tx.account.account_type,
                "balance": str(tx.account.balance),
            },
            "category": {
                "id": tx.category.id,
                "name": tx.category.name,
                "category_type": tx.category.category_type,
            },
        })

    if request.method in ("PUT", "PATCH"):
        try:
            data = json.loads(request.body)
            tx = update_transaction_for_user(request.user, tx_id, data)

            if not tx:
                return JsonResponse({"error": "not found"}, status=404)

            return JsonResponse({"status": "success"})

        except json.JSONDecodeError:
            return JsonResponse({"error": "invalid JSON"}, status=400)

        except ValidationError as e:
            return JsonResponse({"error": e.message}, status=400)

    if request.method == "DELETE":
        ok = delete_transaction_for_user(request.user, tx_id)

        if not ok:
            return JsonResponse({"error": "not found"}, status=404)

        return JsonResponse({"status": "deleted"})

    return JsonResponse({"error": "method not allowed"}, status=405)