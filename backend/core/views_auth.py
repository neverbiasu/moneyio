import json

from django.contrib.auth import login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .services_auth import authenticate_user, register_user, update_password


@csrf_exempt
def register(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=400)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "invalid JSON"}, status=400)

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not password:
        return JsonResponse({"error": "missing fields"}, status=400)

    user = register_user(username, email, password)

    return JsonResponse({"status": "success", "user_id": user.id})


@csrf_exempt
def login_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=400)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "invalid JSON"}, status=400)

    username = data.get("username")
    password = data.get("password")

    user = authenticate_user(username, password)

    if user is None:
        return JsonResponse({"error": "invalid credentials"}, status=401)

    login(request, user)

    return JsonResponse({"status": "success", "username": user.username})


@csrf_exempt
def logout_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "method not allowed"}, status=405)

    logout(request)
    return JsonResponse({"status": "logged out"})


def current_user(request):
    if request.method != "GET":
        return JsonResponse({"error": "method not allowed"}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({"user": None})

    return JsonResponse(
        {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
        }
    )


@csrf_exempt
def change_password(request):
    if request.method != "POST":
        return JsonResponse({"error": "method not allowed"}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({"error": "login required"}, status=401)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "invalid JSON"}, status=400)

    new_password = data.get("password")

    if not new_password:
        return JsonResponse({"error": "password required"}, status=400)

    update_password(request.user, new_password)

    return JsonResponse({"status": "password updated"})
