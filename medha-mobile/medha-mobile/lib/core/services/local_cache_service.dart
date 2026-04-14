import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

class LocalCacheService {
  static const _dbName = "medha_cache.db";
  Database? _db;

  Future<Database> get database async {
    if (_db != null) return _db!;
    final path = join(await getDatabasesPath(), _dbName);
    _db = await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute(
          "CREATE TABLE IF NOT EXISTS appointments(id TEXT PRIMARY KEY, payload TEXT, updatedAt INTEGER)",
        );
        await db.execute(
          "CREATE TABLE IF NOT EXISTS prescriptions(id TEXT PRIMARY KEY, payload TEXT, updatedAt INTEGER)",
        );
        await db.execute(
          "CREATE TABLE IF NOT EXISTS doctors(id TEXT PRIMARY KEY, payload TEXT, updatedAt INTEGER)",
        );
        await db.execute(
          "CREATE TABLE IF NOT EXISTS hospitals(id TEXT PRIMARY KEY, payload TEXT, updatedAt INTEGER)",
        );
        await db.execute(
          "CREATE TABLE IF NOT EXISTS sync_queue(id INTEGER PRIMARY KEY AUTOINCREMENT, entity TEXT, payload TEXT, createdAt INTEGER)",
        );
      },
    );
    return _db!;
  }

  Future<void> upsertJson(String table, String id, String payload) async {
    final db = await database;
    await db.insert(
      table,
      {"id": id, "payload": payload, "updatedAt": DateTime.now().millisecondsSinceEpoch},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<Map<String, Object?>>> getAll(String table) async {
    final db = await database;
    return db.query(table, orderBy: "updatedAt DESC");
  }

  Future<void> enqueueSync(String entity, String payload) async {
    final db = await database;
    await db.insert(
      "sync_queue",
      {"entity": entity, "payload": payload, "createdAt": DateTime.now().millisecondsSinceEpoch},
    );
  }
}

