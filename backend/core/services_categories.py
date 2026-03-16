from django.core.exceptions import ValidationError

from .models import Category


def list_categories_for_user(user):
    """
    Retrieve all categories belonging to the given user.

    select_related("parent") is used to avoid additional database
    queries when accessing the parent category.

    Returns:
        QuerySet[Category]
    """
    return (
        Category.objects.filter(user=user)
        .select_related("parent")
        .order_by("category_type", "tree_level", "name")
    )


def build_category_tree_for_user(user):
    """
    Build a hierarchical category tree (two levels).

    Structure returned:
    [
        {
            "id": parent_id,
            "name": parent_name,
            "category_type": "...",
            "tree_level": 1,
            "children": [...]
        }
    ]

    This function avoids additional database queries by using the
    already fetched category list.
    """

    categories = list_categories_for_user(user)

    parents = []
    children_map = {}

    # First pass: collect parent categories
    for category in categories:
        if category.parent_id is None:
            parents.append(category)
            children_map[category.id] = []

    # Second pass: attach children to parents
    for category in categories:
        if category.parent_id is not None:
            children_map.setdefault(category.parent_id, []).append(category)

    results = []

    for parent in parents:
        results.append(
            {
                "id": parent.id,
                "name": parent.name,
                "category_type": parent.category_type,
                "tree_level": parent.tree_level,
                "children": [
                    {
                        "id": child.id,
                        "name": child.name,
                        "category_type": child.category_type,
                        "tree_level": child.tree_level,
                        "parent_id": child.parent_id,
                    }
                    for child in children_map.get(parent.id, [])
                ],
            }
        )

    return results


def create_category_for_user(user, payload):
    """
    Create a new category for the user.

    Supports two levels of hierarchy:
    - Level 1: parent category
    - Level 2: child category

    Validation rules:
    - name and category_type are required
    - only two levels are allowed
    - child category must have the same category_type as parent
    """

    name = payload.get("name")
    category_type = payload.get("category_type")
    parent_id = payload.get("parent_id")
    icon_id = payload.get("icon_id")

    if not name or not category_type:
        raise ValidationError("name and category_type are required")

    parent = None
    tree_level = 1

    # Handle child category creation
    if parent_id:
        parent = Category.objects.filter(id=parent_id, user=user).first()

        if not parent:
            raise ValidationError("invalid parent_id")

        if parent.tree_level >= 2:
            raise ValidationError("only two levels of categories are allowed")

        if parent.category_type != category_type:
            raise ValidationError(
                "child category must have the same category_type as parent"
            )

        tree_level = 2

    category = Category.objects.create(
        user=user,
        parent=parent,
        name=name,
        category_type=category_type,
        icon_id=icon_id,
        tree_level=tree_level,
    )

    return category


def get_category_for_user(user, category_id):
    """
    Retrieve a single category belonging to the user.

    select_related("parent") avoids extra queries when accessing
    the parent category.
    """
    return (
        Category.objects.filter(id=category_id, user=user)
        .select_related("parent")
        .first()
    )


def update_category_for_user(user, category_id, payload):
    """
    Update category fields.

    Supported updates:
    - name
    - icon_id
    - parent_id (reorganize category hierarchy)

    Validation rules:
    - name cannot be empty
    - category cannot be its own parent
    - hierarchy depth limited to 2
    - category_type must match parent
    """

    category = get_category_for_user(user, category_id)

    if not category:
        return None

    # Update name
    if "name" in payload:
        if not payload["name"]:
            raise ValidationError("name cannot be empty")
        category.name = payload["name"]

    # Update icon
    if "icon_id" in payload:
        category.icon_id = payload.get("icon_id")

    # Update parent
    if "parent_id" in payload:
        parent_id = payload.get("parent_id")

        # Move category to top level
        if parent_id in ("", None):
            category.parent = None
            category.tree_level = 1

        else:
            parent = Category.objects.filter(id=parent_id, user=user).first()

            if not parent:
                raise ValidationError("invalid parent_id")

            if parent.id == category.id:
                raise ValidationError("category cannot be its own parent")

            if parent.tree_level >= 2:
                raise ValidationError(
                    "only two levels of categories are allowed"
                )

            if parent.category_type != category.category_type:
                raise ValidationError(
                    "child category must have the same category_type as parent"
                )

            category.parent = parent
            category.tree_level = 2

    category.save()

    return category


def delete_category_for_user(user, category_id):
    """
    Delete a category belonging to the user.

    If the category has child categories,
    they will also be deleted to maintain consistency.
    """

    category = get_category_for_user(user, category_id)

    if not category:
        return False

    # Delete child categories first
    Category.objects.filter(parent=category, user=user).delete()

    # Delete the parent category
    category.delete()

    return True