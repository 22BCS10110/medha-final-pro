from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0005_patient_extra_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='patient',
            name='supabase_uid',
            field=models.CharField(
                blank=True,
                help_text='Supabase auth.users UUID',
                max_length=36,
                null=True,
                unique=True,
            ),
        ),
    ]
