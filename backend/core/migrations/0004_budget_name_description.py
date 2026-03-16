from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0003_alter_budget_user_alter_category_user_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="budget",
            name="description",
            field=models.CharField(blank=True, default="", max_length=254),
        ),
        migrations.AddField(
            model_name="budget",
            name="name",
            field=models.CharField(default="General Budget", max_length=128),
        ),
    ]
