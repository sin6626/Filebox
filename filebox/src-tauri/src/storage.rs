use rusqlite::{params, Connection, Result as SqlResult};
use serde::Serialize;
use std::path::PathBuf;

#[derive(Debug, Serialize, Clone)]
pub struct Group {
    pub id: i32,
    pub name: String,
    pub is_fixed: bool,
}

#[derive(Debug, Serialize, Clone)]
pub struct FileMapping {
    pub id: i32,
    pub group_id: i32,
    pub file_path: String,
    pub file_name: String,
    pub added_at: i64,
}

pub struct Storage {
    conn: Connection,
}

impl Storage {
    pub fn new(db_path: PathBuf) -> SqlResult<Self> {
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).ok();
        }
        let conn = Connection::open(db_path)?;
        let storage = Storage { conn };
        storage.init_schema()?;
        Ok(storage)
    }

    fn init_schema(&self) -> SqlResult<()> {
        self.conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                is_fixed BOOLEAN NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS file_mappings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                file_name TEXT NOT NULL,
                added_at INTEGER NOT NULL,
                FOREIGN KEY (group_id) REFERENCES groups(id),
                UNIQUE(group_id, file_path)
            );

            INSERT OR IGNORE INTO groups (name, is_fixed) VALUES ('最近收到', 1);
            ",
        )?;
        Ok(())
    }

    pub fn list_groups(&self) -> SqlResult<Vec<Group>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, is_fixed FROM groups ORDER BY is_fixed DESC, created_at ASC",
        )?;
        let groups = stmt
            .query_map([], |row| {
                Ok(Group {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    is_fixed: row.get(2)?,
                })
            })?
            .collect::<SqlResult<Vec<_>>>()?;
        Ok(groups)
    }

    pub fn create_group(&self, name: &str) -> SqlResult<Group> {
        self.conn.execute(
            "INSERT INTO groups (name, is_fixed) VALUES (?1, 0)",
            params![name],
        )?;
        let id = self.conn.last_insert_rowid() as i32;
        Ok(Group {
            id,
            name: name.to_string(),
            is_fixed: false,
        })
    }

    pub fn rename_group(&self, id: i32, new_name: &str) -> SqlResult<bool> {
        let rows = self.conn.execute(
            "UPDATE groups SET name = ?1 WHERE id = ?2 AND is_fixed = 0",
            params![new_name, id],
        )?;
        Ok(rows > 0)
    }

    pub fn delete_group(&self, id: i32) -> SqlResult<bool> {
        let rows = self.conn.execute(
            "DELETE FROM groups WHERE id = ?1 AND is_fixed = 0",
            params![id],
        )?;
        Ok(rows > 0)
    }

    pub fn clear_group(&self, id: i32) -> SqlResult<()> {
        self.conn
            .execute("DELETE FROM file_mappings WHERE group_id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_recent_group(&self) -> SqlResult<Option<Group>> {
        let mut stmt = self
            .conn
            .prepare("SELECT id, name, is_fixed FROM groups WHERE name = '最近收到' LIMIT 1")?;
        let mut rows = stmt.query_map([], |row| {
            Ok(Group {
                id: row.get(0)?,
                name: row.get(1)?,
                is_fixed: row.get(2)?,
            })
        })?;
        match rows.next() {
            Some(row) => Ok(Some(row?)),
            None => Ok(None),
        }
    }

    pub fn add_mapping(
        &self,
        group_id: i32,
        file_path: &str,
        file_name: &str,
        added_at: i64,
    ) -> SqlResult<FileMapping> {
        self.conn.execute(
            "INSERT OR IGNORE INTO file_mappings (group_id, file_path, file_name, added_at) VALUES (?1, ?2, ?3, ?4)",
            params![group_id, file_path, file_name, added_at],
        )?;
        let id = self.conn.last_insert_rowid() as i32;
        Ok(FileMapping {
            id,
            group_id,
            file_path: file_path.to_string(),
            file_name: file_name.to_string(),
            added_at,
        })
    }

    pub fn list_mappings(&self, group_id: i32) -> SqlResult<Vec<FileMapping>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, group_id, file_path, file_name, added_at FROM file_mappings WHERE group_id = ?1 ORDER BY added_at DESC",
        )?;
        let mappings = stmt
            .query_map(params![group_id], |row| {
                Ok(FileMapping {
                    id: row.get(0)?,
                    group_id: row.get(1)?,
                    file_path: row.get(2)?,
                    file_name: row.get(3)?,
                    added_at: row.get(4)?,
                })
            })?
            .collect::<SqlResult<Vec<_>>>()?;
        Ok(mappings)
    }

    pub fn remove_mapping(&self, id: i32) -> SqlResult<bool> {
        let rows = self
            .conn
            .execute("DELETE FROM file_mappings WHERE id = ?1", params![id])?;
        Ok(rows > 0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn test_storage() -> Storage {
        Storage::new(PathBuf::from(":memory:")).unwrap()
    }

    #[test]
    fn test_init_creates_default_group() {
        let storage = test_storage();
        let groups = storage.list_groups().unwrap();
        assert_eq!(groups.len(), 1);
        assert_eq!(groups[0].name, "最近收到");
        assert!(groups[0].is_fixed);
    }

    #[test]
    fn test_create_and_list_groups() {
        let storage = test_storage();
        storage.create_group("Work").unwrap();
        storage.create_group("Personal").unwrap();
        let groups = storage.list_groups().unwrap();
        assert_eq!(groups.len(), 3);
        assert_eq!(groups[0].name, "最近收到");
        assert_eq!(groups[1].name, "Work");
        assert_eq!(groups[2].name, "Personal");
    }

    #[test]
    fn test_rename_group() {
        let storage = test_storage();
        let group = storage.create_group("Old Name").unwrap();
        assert!(storage.rename_group(group.id, "New Name").unwrap());
        let groups = storage.list_groups().unwrap();
        let renamed = groups.iter().find(|g| g.id == group.id).unwrap();
        assert_eq!(renamed.name, "New Name");
    }

    #[test]
    fn test_cannot_rename_fixed_group() {
        let storage = test_storage();
        let recent = storage.get_recent_group().unwrap().unwrap();
        assert!(!storage.rename_group(recent.id, "Hack").unwrap());
    }

    #[test]
    fn test_delete_group() {
        let storage = test_storage();
        let group = storage.create_group("To Delete").unwrap();
        assert!(storage.delete_group(group.id).unwrap());
        assert_eq!(storage.list_groups().unwrap().len(), 1);
    }

    #[test]
    fn test_cannot_delete_fixed_group() {
        let storage = test_storage();
        let recent = storage.get_recent_group().unwrap().unwrap();
        assert!(!storage.delete_group(recent.id).unwrap());
    }

    #[test]
    fn test_add_and_list_mappings() {
        let storage = test_storage();
        let recent = storage.get_recent_group().unwrap().unwrap();
        storage
            .add_mapping(recent.id, "/tmp/a.txt", "a.txt", 1000)
            .unwrap();
        storage
            .add_mapping(recent.id, "/tmp/b.txt", "b.txt", 2000)
            .unwrap();
        let mappings = storage.list_mappings(recent.id).unwrap();
        assert_eq!(mappings.len(), 2);
        assert_eq!(mappings[0].file_name, "b.txt");
        assert_eq!(mappings[1].file_name, "a.txt");
    }

    #[test]
    fn test_remove_mapping() {
        let storage = test_storage();
        let recent = storage.get_recent_group().unwrap().unwrap();
        let mapping = storage
            .add_mapping(recent.id, "/tmp/c.txt", "c.txt", 3000)
            .unwrap();
        assert!(storage.remove_mapping(mapping.id).unwrap());
        assert_eq!(storage.list_mappings(recent.id).unwrap().len(), 0);
    }

    #[test]
    fn test_clear_group() {
        let storage = test_storage();
        let recent = storage.get_recent_group().unwrap().unwrap();
        storage
            .add_mapping(recent.id, "/tmp/d.txt", "d.txt", 4000)
            .unwrap();
        storage
            .add_mapping(recent.id, "/tmp/e.txt", "e.txt", 5000)
            .unwrap();
        storage.clear_group(recent.id).unwrap();
        assert_eq!(storage.list_mappings(recent.id).unwrap().len(), 0);
    }

    #[test]
    fn test_duplicate_mapping_ignored() {
        let storage = test_storage();
        let recent = storage.get_recent_group().unwrap().unwrap();
        storage
            .add_mapping(recent.id, "/tmp/f.txt", "f.txt", 6000)
            .unwrap();
        storage
            .add_mapping(recent.id, "/tmp/f.txt", "f.txt", 6000)
            .unwrap();
        let mappings = storage.list_mappings(recent.id).unwrap();
        assert_eq!(mappings.len(), 1);
    }
}
