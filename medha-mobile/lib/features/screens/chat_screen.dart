import 'package:flutter/material.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _text = TextEditingController();
  String roomId = "patient_general";
  final rooms = const [
    ("patient_general", "General Support", Icons.support_agent_rounded),
    ("patient_hospital", "Hospital Desk", Icons.local_hospital_rounded),
    ("patient_doctor", "Doctor Chat", Icons.medical_services_rounded),
  ];

  // Local message storage (replace with API call later)
  final Map<String, List<Map<String, dynamic>>> _messages = {};

  Future<void> _send() async {
    final value = _text.text.trim();
    if (value.isEmpty) return;

    if (!_messages.containsKey(roomId)) {
      _messages[roomId] = [];
    }

    setState(() {
      _messages[roomId]!.insert(0, {
        "text": value,
        "sender": "patient",
        "createdAt": DateTime.now(),
      });
    });
    _text.clear();
  }

  @override
  Widget build(BuildContext context) {
    final messages = _messages[roomId] ?? [];
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Text("Chat", style: tt.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
            ),
            const SizedBox(height: 14),

            // Channel chips
            SizedBox(
              height: 48,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: rooms.map((r) {
                  final selected = roomId == r.$1;
                  return Padding(
                    padding: const EdgeInsets.only(right: 10),
                    child: GestureDetector(
                      onTap: () => setState(() => roomId = r.$1),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(
                          color: selected ? cs.primary : Colors.white,
                          borderRadius: BorderRadius.circular(999),
                          boxShadow: selected
                              ? [
                                  BoxShadow(
                                    color: cs.primary.withValues(alpha: 0.2),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ]
                              : null,
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(r.$3, size: 18, color: selected ? Colors.white : cs.onSurface.withValues(alpha: 0.5)),
                            const SizedBox(width: 8),
                            Text(
                              r.$2,
                              style: tt.labelLarge?.copyWith(
                                fontWeight: FontWeight.w700,
                                color: selected ? Colors.white : cs.onSurface.withValues(alpha: 0.6),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 10),

            // Messages
            Expanded(
              child: messages.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.chat_bubble_outline_rounded, size: 48, color: cs.onSurface.withValues(alpha: 0.15)),
                          const SizedBox(height: 12),
                          Text(
                            "No messages yet",
                            style: tt.bodyMedium?.copyWith(
                              color: cs.onSurface.withValues(alpha: 0.4),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      reverse: true,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      itemCount: messages.length,
                      itemBuilder: (_, i) {
                        final mine = messages[i]["sender"] == "patient";
                        return Align(
                          alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.symmetric(vertical: 4),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
                            decoration: BoxDecoration(
                              color: mine ? cs.primary : Colors.white,
                              borderRadius: BorderRadius.only(
                                topLeft: const Radius.circular(18),
                                topRight: const Radius.circular(18),
                                bottomLeft: mine ? const Radius.circular(18) : const Radius.circular(4),
                                bottomRight: mine ? const Radius.circular(4) : const Radius.circular(18),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: AppTheme.primary.withValues(alpha: 0.06),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Text(
                              messages[i]["text"] ?? "",
                              style: tt.bodyMedium?.copyWith(
                                color: mine ? Colors.white : cs.onSurface,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
            ),

            // Input bar
            Container(
              padding: const EdgeInsets.fromLTRB(20, 12, 12, 12),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary.withValues(alpha: 0.06),
                    blurRadius: 12,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceContainerLow,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: TextField(
                        controller: _text,
                        decoration: InputDecoration(
                          hintText: "Type message...",
                          hintStyle: tt.bodyMedium?.copyWith(
                            color: cs.onSurface.withValues(alpha: 0.35),
                          ),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Material(
                    color: cs.primary,
                    borderRadius: BorderRadius.circular(999),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(999),
                      onTap: _send,
                      child: const Padding(
                        padding: EdgeInsets.all(12),
                        child: Icon(Icons.send_rounded, color: Colors.white, size: 22),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}