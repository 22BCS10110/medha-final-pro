from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0004_add_nfc_uid_to_patientcard'),
    ]

    operations = [
        migrations.AddField(
            model_name='patient',
            name='address',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='patient',
            name='existing_diseases',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='patient',
            name='height_cm',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
        migrations.AddField(
            model_name='patient',
            name='weight_kg',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
    ]
