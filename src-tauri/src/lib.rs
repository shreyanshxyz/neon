use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

#[derive(Serialize)]
struct DirectoryEntryDto {
    name: String,
    path: String,
    is_dir: bool,
    is_symlink: bool,
    size: Option<u64>,
    modified_ms: Option<i64>,
}

fn to_ms(t: SystemTime) -> Option<i64> {
    t.duration_since(SystemTime::UNIX_EPOCH)
        .ok()
        .and_then(|d| i64::try_from(d.as_millis()).ok())
}

#[tauri::command]
fn list_dir(path: String) -> Result<Vec<DirectoryEntryDto>, String> {
    let root = PathBuf::from(&path);
    if !root.is_dir() {
        return Err(format!("not a directory: {path}"));
    }

    let mut out = Vec::with_capacity(256);

    let iter = fs::read_dir(&root).map_err(|e| e.to_string())?;
    for ent in iter {
        let ent = match ent {
            Ok(e) => e,
            Err(_) => continue,
        };

        let file_path = ent.path();
        let name = ent.file_name().to_string_lossy().into_owned();

        let ft = match ent.file_type() {
            Ok(ft) => ft,
            Err(_) => continue,
        };
        let is_symlink = ft.is_symlink();
        let is_dir = if is_symlink {
            file_path.is_dir()
        } else {
            ft.is_dir()
        };

        let (size, modified_ms) = match fs::symlink_metadata(&file_path) {
            Ok(meta) => {
                let size = if meta.is_file() {
                    Some(meta.len())
                } else {
                    None
                };
                let modified_ms = meta.modified().ok().and_then(to_ms);
                (size, modified_ms)
            }
            Err(_) => (None, None),
        };

        out.push(DirectoryEntryDto {
            name,
            path: file_path.to_string_lossy().into_owned(),
            is_dir,
            is_symlink,
            size,
            modified_ms,
        });
    }

    out.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    Ok(out)
}

#[tauri::command]
fn parent_dir(path: String) -> Option<String> {
    Path::new(&path)
        .parent()
        .map(|p| p.to_string_lossy().into_owned())
}

#[tauri::command]
fn home_dir() -> Result<String, String> {
    dirs::home_dir()
        .map(|p| p.display().to_string())
        .ok_or_else(|| "no home dir".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![home_dir, list_dir, parent_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
