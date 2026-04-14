import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';

class MedicalRecordsScreen extends StatefulWidget {
  const MedicalRecordsScreen({super.key});

  @override
  State<MedicalRecordsScreen> createState() => _MedicalRecordsScreenState();
}

class _MedicalRecordsScreenState extends State<MedicalRecordsScreen> {
  bool uploading = false;
  String category = "Reports";
  final categories = ["Reports", "Prescriptions", "History"];
  
  // Local storage for records
  final List<Map<String, dynamic>> _records = [];

  Future<void> _upload() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery);
    if (file == null) return;
    setState(() => uploading = true);
    try {
      // Store locally instead of Firebase
      setState(() {
        _records.insert(0, {
          "patientId": "guest_patient",
          "type": category.toLowerCase(),
          "fileName": file.name,
          "filePath": file.path,
          "uploadedAt": DateTime.now(),
        });
      });
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Record uploaded")));
    } finally {
      if (mounted) setState(() => uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filteredRecords = _records.where((r) => r["type"] == category.toLowerCase()).toList();
    
    return Scaffold(
      appBar: AppBar(
        title: Text("Medical Records", style: GoogleFonts.manrope(fontWeight: FontWeight.w700)),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Category tabs
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 14),
            child: Container(
              decoration: BoxDecoration(
                color: AppTheme.surfaceContainerLow,
                borderRadius: BorderRadius.circular(14),
              ),
              padding: const EdgeInsets.all(4),
              child: Row(
                children: categories.map((c) {
                  final selected = category == c;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => category = c),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: selected ? Colors.white : Colors.transparent,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: selected ? [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))] : null,
                        ),
                        child: Center(
                          child: Text(
                            c,
                            style: GoogleFonts.plusJakartaSans(
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                              color: selected ? AppTheme.primary : AppTheme.onSurface.withValues(alpha: 0.5),
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          // Records list
          Expanded(
            child: filteredRecords.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.folder_open_rounded, size: 48, color: AppTheme.onSurface.withValues(alpha: 0.15)),
                        const SizedBox(height: 12),
                        Text("No records in this category", style: GoogleFonts.plusJakartaSans(color: AppTheme.onSurface.withValues(alpha: 0.4), fontWeight: FontWeight.w600)),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: filteredRecords.length,
                    itemBuilder: (_, i) {
                      final record = filteredRecords[i];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: AppTheme.primary.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.description_rounded, color: AppTheme.primary, size: 22),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(category, style: GoogleFonts.manrope(fontWeight: FontWeight.w700, fontSize: 15, color: AppTheme.onSurface)),
                                  const SizedBox(height: 3),
                                  Text(
                                    record["fileName"] ?? "",
                                    style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w500, fontSize: 11, color: AppTheme.onSurface.withValues(alpha: 0.4)),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
          // Upload button
          Padding(
            padding: const EdgeInsets.all(20),
            child: uploading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                : FilledButton.icon(
                    onPressed: _upload,
                    icon: const Icon(Icons.upload_file_rounded),
                    label: Text("Upload $category", style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 15)),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(56),
                      shape: const StadiumBorder(),
                      elevation: 0,
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}