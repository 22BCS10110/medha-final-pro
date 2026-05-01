"""
ABDM Simulator — Mock FHIR Resource Generator
==============================================
Generates realistic FHIR R4 resources for demo purposes.
These mock resources follow the exact FHIR R4 specification schema
so they can be replaced with real data when connecting to NDHM.

References:
  - https://www.hl7.org/fhir/R4/
  - https://nrces.in/ndhm/fhir/r4/  (India NRCeS profiles)
"""
import uuid
import random
from datetime import datetime, timedelta


def generate_fhir_patient(patient, abha_record):
    """Generate a FHIR R4 Patient resource from internal patient data."""
    return {
        "resourceType": "Patient",
        "id": str(patient.id),
        "meta": {
            "profile": [
                "https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient"
            ],
            "lastUpdated": patient.updated_at.isoformat() if patient.updated_at else datetime.now().isoformat()
        },
        "identifier": [
            {
                "type": {
                    "coding": [{
                        "system": "https://ndhm.gov.in/identifiers",
                        "code": "ABHA"
                    }]
                },
                "system": "https://healthid.abdm.gov.in",
                "value": abha_record.abha_number if abha_record else patient.abha_id
            },
            {
                "type": {
                    "coding": [{
                        "system": "https://ndhm.gov.in/identifiers",
                        "code": "MR"
                    }]
                },
                "system": "https://medha.health/patient-id",
                "value": patient.patient_id
            }
        ],
        "name": [{
            "use": "official",
            "text": patient.full_name,
            "given": patient.full_name.split()[:-1] if len(patient.full_name.split()) > 1 else [patient.full_name],
            "family": patient.full_name.split()[-1] if len(patient.full_name.split()) > 1 else ""
        }],
        "gender": {
            'M': 'male', 'F': 'female', 'O': 'other'
        }.get(patient.gender, 'unknown'),
        "birthDate": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
        "telecom": [
            {"system": "phone", "value": patient.phone, "use": "mobile"} if patient.phone else None,
            {"system": "email", "value": patient.email, "use": "home"} if patient.email else None,
        ],
        "active": patient.status == 'active'
    }


def generate_fhir_encounter(appointment, hospital):
    """Generate a FHIR R4 Encounter resource from an appointment."""
    return {
        "resourceType": "Encounter",
        "id": str(appointment.id),
        "meta": {
            "profile": [
                "https://nrces.in/ndhm/fhir/r4/StructureDefinition/Encounter"
            ]
        },
        "status": {
            'upcoming': 'planned',
            'completed': 'finished',
            'cancelled': 'cancelled',
            'critical': 'in-progress'
        }.get(appointment.status, 'planned'),
        "class": {
            "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            "code": "AMB",
            "display": "Ambulatory"
        },
        "type": [{
            "coding": [{
                "system": "http://snomed.info/sct",
                "code": "270427003",
                "display": appointment.get_appointment_type_display() if hasattr(appointment, 'get_appointment_type_display') else appointment.appointment_type
            }]
        }],
        "subject": {
            "reference": f"Patient/{appointment.patient_id}"
        },
        "participant": [{
            "individual": {
                "reference": f"Practitioner/{appointment.doctor_id}",
                "display": appointment.doctor.full_name if appointment.doctor else "Unknown"
            }
        }],
        "period": {
            "start": f"{appointment.date}T{appointment.time}",
        },
        "serviceProvider": {
            "reference": f"Organization/{hospital.id}",
            "display": hospital.name
        },
        "reasonCode": [{
            "text": appointment.complaint or "General consultation"
        }] if appointment.complaint else []
    }


def generate_fhir_observation(vital, patient):
    """Generate FHIR R4 Observation resources from vitals."""
    observations = []

    if vital.blood_pressure:
        observations.append({
            "resourceType": "Observation",
            "id": f"{vital.id}-bp",
            "status": "final",
            "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs"}]}],
            "code": {"coding": [{"system": "http://loinc.org", "code": "85354-9", "display": "Blood pressure panel"}]},
            "subject": {"reference": f"Patient/{patient.id}"},
            "effectiveDateTime": vital.recorded_at.isoformat(),
            "valueString": vital.blood_pressure
        })

    if vital.heart_rate:
        observations.append({
            "resourceType": "Observation",
            "id": f"{vital.id}-hr",
            "status": "final",
            "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs"}]}],
            "code": {"coding": [{"system": "http://loinc.org", "code": "8867-4", "display": "Heart rate"}]},
            "subject": {"reference": f"Patient/{patient.id}"},
            "effectiveDateTime": vital.recorded_at.isoformat(),
            "valueQuantity": {"value": vital.heart_rate, "unit": "beats/minute", "system": "http://unitsofmeasure.org", "code": "/min"}
        })

    if vital.spo2:
        observations.append({
            "resourceType": "Observation",
            "id": f"{vital.id}-spo2",
            "status": "final",
            "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs"}]}],
            "code": {"coding": [{"system": "http://loinc.org", "code": "2708-6", "display": "Oxygen saturation"}]},
            "subject": {"reference": f"Patient/{patient.id}"},
            "effectiveDateTime": vital.recorded_at.isoformat(),
            "valueQuantity": {"value": vital.spo2, "unit": "%", "system": "http://unitsofmeasure.org", "code": "%"}
        })

    if vital.temperature:
        observations.append({
            "resourceType": "Observation",
            "id": f"{vital.id}-temp",
            "status": "final",
            "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs"}]}],
            "code": {"coding": [{"system": "http://loinc.org", "code": "8310-5", "display": "Body temperature"}]},
            "subject": {"reference": f"Patient/{patient.id}"},
            "effectiveDateTime": vital.recorded_at.isoformat(),
            "valueQuantity": {"value": vital.temperature, "unit": "°C", "system": "http://unitsofmeasure.org", "code": "Cel"}
        })

    return observations


def generate_fhir_medication_request(prescription, patient):
    """Generate a FHIR R4 MedicationRequest resource."""
    return {
        "resourceType": "MedicationRequest",
        "id": str(prescription.id),
        "meta": {
            "profile": [
                "https://nrces.in/ndhm/fhir/r4/StructureDefinition/MedicationRequest"
            ]
        },
        "status": {
            'active': 'active',
            'completed': 'completed',
            'cancelled': 'cancelled'
        }.get(prescription.status, 'active'),
        "intent": "order",
        "medicationCodeableConcept": {
            "text": prescription.medicine
        },
        "subject": {"reference": f"Patient/{patient.id}"},
        "authoredOn": prescription.date.isoformat() if prescription.date else None,
        "requester": {
            "reference": f"Practitioner/{prescription.doctor_id}",
            "display": prescription.doctor.full_name if prescription.doctor else "Unknown"
        },
        "dosageInstruction": [{
            "text": f"{prescription.dosage} for {prescription.duration}",
            "timing": {"code": {"text": prescription.dosage}},
        }],
        "note": [{"text": prescription.notes}] if prescription.notes else []
    }


def generate_fhir_diagnostic_report(health_record, patient):
    """Generate a FHIR R4 DiagnosticReport resource."""
    return {
        "resourceType": "DiagnosticReport",
        "id": str(health_record.id),
        "meta": {
            "profile": [
                "https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportLab"
            ]
        },
        "status": "final",
        "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v2-0074", "code": "LAB"}]}],
        "code": {"text": health_record.diagnosis},
        "subject": {"reference": f"Patient/{patient.id}"},
        "effectiveDateTime": health_record.date.isoformat(),
        "issued": health_record.created_at.isoformat() if health_record.created_at else None,
        "performer": [{
            "reference": f"Practitioner/{health_record.doctor_id}",
            "display": health_record.doctor.full_name if health_record.doctor else "Unknown"
        }],
        "conclusion": health_record.diagnosis,
        "presentedForm": [
            {"contentType": "application/pdf", "url": att}
            for att in (health_record.attachments or [])
        ] if health_record.attachments else []
    }


def generate_fhir_bundle(patient, abha_record, encounters=None, observations=None,
                          medications=None, reports=None):
    """
    Generate a complete FHIR R4 Bundle containing all patient resources.
    This is the payload format used in ABDM Health Information Exchange.
    """
    entries = []

    # Patient resource
    patient_resource = generate_fhir_patient(patient, abha_record)
    entries.append({
        "fullUrl": f"Patient/{patient.id}",
        "resource": patient_resource
    })

    # Encounters
    for enc in (encounters or []):
        entries.append({
            "fullUrl": f"Encounter/{enc['id']}",
            "resource": enc
        })

    # Observations
    for obs in (observations or []):
        entries.append({
            "fullUrl": f"Observation/{obs['id']}",
            "resource": obs
        })

    # Medications
    for med in (medications or []):
        entries.append({
            "fullUrl": f"MedicationRequest/{med['id']}",
            "resource": med
        })

    # Diagnostic Reports
    for rep in (reports or []):
        entries.append({
            "fullUrl": f"DiagnosticReport/{rep['id']}",
            "resource": rep
        })

    return {
        "resourceType": "Bundle",
        "id": str(uuid.uuid4()),
        "meta": {
            "lastUpdated": datetime.now().isoformat()
        },
        "type": "collection",
        "total": len(entries),
        "entry": entries,
        # ABDM-specific metadata
        "extension": [{
            "url": "https://ndhm.gov.in/fhir/extensions/data-origin",
            "valueString": "Medha Health Intelligance Intelligence Platform (Simulated)"
        }]
    }


def generate_mock_fhir_bundle_for_patient(patient_abha_id):
    """
    Generate a fully synthetic FHIR bundle when real patient data is not available.
    Useful for demo purposes with fictional data.
    """
    mock_patient_id = str(uuid.uuid4())

    return {
        "resourceType": "Bundle",
        "id": str(uuid.uuid4()),
        "type": "collection",
        "total": 4,
        "entry": [
            {
                "fullUrl": f"Patient/{mock_patient_id}",
                "resource": {
                    "resourceType": "Patient",
                    "id": mock_patient_id,
                    "identifier": [{"system": "https://healthid.abdm.gov.in", "value": patient_abha_id}],
                    "name": [{"text": "Demo Patient", "given": ["Demo"], "family": "Patient"}],
                    "gender": "male",
                    "birthDate": "1990-05-15"
                }
            },
            {
                "fullUrl": f"Encounter/{uuid.uuid4()}",
                "resource": {
                    "resourceType": "Encounter",
                    "status": "finished",
                    "class": {"code": "AMB", "display": "Ambulatory"},
                    "type": [{"text": "General Consultation"}],
                    "period": {"start": (datetime.now() - timedelta(days=7)).isoformat()}
                }
            },
            {
                "fullUrl": f"MedicationRequest/{uuid.uuid4()}",
                "resource": {
                    "resourceType": "MedicationRequest",
                    "status": "active",
                    "intent": "order",
                    "medicationCodeableConcept": {"text": "Paracetamol 500mg"},
                    "dosageInstruction": [{"text": "1 tablet twice daily for 5 days"}]
                }
            },
            {
                "fullUrl": f"DiagnosticReport/{uuid.uuid4()}",
                "resource": {
                    "resourceType": "DiagnosticReport",
                    "status": "final",
                    "code": {"text": "Complete Blood Count"},
                    "conclusion": "All values within normal range. Hemoglobin: 14.2 g/dL, WBC: 7500/μL, Platelets: 250000/μL"
                }
            }
        ]
    }
