import json

from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .services_budgets import (
    create_budget_for_user,
    delete_budget_for_user,
    get_budget_for_user,
    list_budgets_for_user,
    update_budget_for_user,
)


def _require_login(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "login required"}, status=401)
    return None


def _serialize_budget(budget):
    return {
        "id": budget.id,
        "name": budget.name,
        "description": budget.description,
        "amount_limit": str(budget.amount_limit),
        "actual_spending": str(budget.actual_spending),
        "budget_month": budget.budget_month.strftime("%Y-%m"),
        "is_recurring": budget.is_recurring,
        "updated_at": budget.upt_time.isoformat(),
    }


@csrf_exempt
def budgets_collection(request):
    auth_error = _require_login(request)
    if auth_error:
        return auth_error

    if request.method == "GET":
        budgets = list_budgets_for_user(request.user)
        return JsonResponse(
            {"results": [_serialize_budget(item) for item in budgets]}
        )

    if request.method == "POST":
        try:
            data = json.loads(request.body)
            budget = create_budget_for_user(request.user, data)
            return JsonResponse(
                {
                    "status": "success",
                    "budget_id": budget.id,
                    "budget": _serialize_budget(budget),
                }
            )
        except json.JSONDecodeError:
            return JsonResponse({"error": "invalid JSON"}, status=400)
        except ValidationError as e:
            return JsonResponse({"error": e.message}, status=400)

    return JsonResponse({"error": "method not allowed"}, status=405)


@csrf_exempt
def budgets_item(request, budget_id):
    auth_error = _require_login(request)
    if auth_error:
        return auth_error

    if request.method == "GET":
        budget = get_budget_for_user(request.user, budget_id)
        if not budget:
            return JsonResponse({"error": "not found"}, status=404)

        return JsonResponse(_serialize_budget(budget))

    if request.method in ("PUT", "PATCH"):
        try:
            data = json.loads(request.body)
            budget = update_budget_for_user(request.user, budget_id, data)
            if not budget:
                return JsonResponse({"error": "not found"}, status=404)
            return JsonResponse({"status": "success", "budget": _serialize_budget(budget)})
        except json.JSONDecodeError:
            return JsonResponse({"error": "invalid JSON"}, status=400)
        except ValidationError as e:
            return JsonResponse({"error": e.message}, status=400)

    if request.method == "DELETE":
        ok = delete_budget_for_user(request.user, budget_id)
        if not ok:
            return JsonResponse({"error": "not found"}, status=404)
        return JsonResponse({"status": "deleted"})

    return JsonResponse({"error": "method not allowed"}, status=405)
