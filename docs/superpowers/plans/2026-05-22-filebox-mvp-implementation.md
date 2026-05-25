# FileBox MVP（不含 AI）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付一个可运行的 Windows 本地 FileBox MVP：监听配置目录、写入 SQLite 历史、侧边栏倒序展示、托盘控制与基础文件操作。

**Architecture:** 使用单进程模块化架构：`config -> watcher -> storage -> sidebar/tray`。将可测试逻辑（配置校验、事件处理、持久化、列表模型）与 UI 绑定层分离，优先用单元测试驱动核心链路，再接入 PyQt5/pystray 壳层。

**Tech Stack:** Python 3.10+, pytest, watchdog, sqlite3, PyQt5, pystray, Pillow, ruff, mypy

---

## 文件结构映射（先定义边界）

- Create: `main.py`（程序入口与依赖装配）
- Create: `src/filebox/__init__.py`（包标识）
- Create: `src/filebox/config/models.py`（配置数据结构）
- Create: `src/filebox/config/service.py`（配置加载、校验、保存）
- Create: `src/filebox/storage/repository.py`（SQLite 建表/写入/查询/删除）
- Create: `src/filebox/watcher/events.py`（文件事件模型）
- Create: `src/filebox/watcher/processor.py`（扩展名过滤、去抖、标准化）
- Create: `src/filebox/watcher/service.py`（watchdog 观察者封装与重载）
- Create: `src/filebox/sidebar/view_model.py`（侧边栏数据与动作接口）
- Create: `src/filebox/sidebar/window.py`（PyQt5 侧边栏窗口）
- Create: `src/filebox/tray/icon.py`（托盘菜单行为）
- Create: `src/filebox/app/coordinator.py`（启动编排、事件串联）
- Create: `tests/test_config_service.py`
- Create: `tests/test_storage_repository.py`
- Create: `tests/test_watcher_processor.py`
- Create: `tests/test_sidebar_view_model.py`
- Create: `tests/test_app_coordinator.py`
- Create: `tests/test_tray_icon.py`
- Create: `tests/test_main_import.py`
- Create: `tests/test_watcher_service.py`
- Modify: `README.md`（更新 MVP 范围与运行说明）

### Task 1: 配置模块（读取/校验/写回）

**Files:**
- Create: `src/filebox/config/models.py`
- Create: `src/filebox/config/service.py`
- Test: `tests/test_config_service.py`

- [ ] **Step 1: 写失败测试（默认值与写回）**

```python
from pathlib import Path

from filebox.config.service import ConfigService


def test_load_defaults_and_save_roundtrip(tmp_path: Path) -> None:
    config_path = tmp_path / "config.json"
    service = ConfigService(config_path)

    cfg = service.load()
    assert cfg.watch_extensions
    assert cfg.notify_on_new_file is True

    cfg.wechat_paths = [r"C:\\Chat\\WeChat"]
    service.save(cfg)

    reloaded = service.load()
    assert reloaded.wechat_paths == [r"C:\\Chat\\WeChat"]
```

- [ ] **Step 2: 运行单测确认失败**

Run: `pytest tests/test_config_service.py::test_load_defaults_and_save_roundtrip -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'filebox'`

- [ ] **Step 3: 写最小实现**

```python
# src/filebox/config/models.py
from dataclasses import dataclass, field


@dataclass
class AppConfig:
    wechat_paths: list[str] = field(default_factory=list)
    qq_paths: list[str] = field(default_factory=list)
    watch_extensions: list[str] = field(default_factory=lambda: [".docx", ".pdf", ".pptx", ".xlsx", ".txt"])
    notify_on_new_file: bool = True


# src/filebox/config/service.py
import json
from dataclasses import asdict
from pathlib import Path

from filebox.config.models import AppConfig


class ConfigService:
    def __init__(self, config_path: Path) -> None:
        self._config_path = config_path

    def load(self) -> AppConfig:
        if not self._config_path.exists():
            return AppConfig()
        payload = json.loads(self._config_path.read_text(encoding="utf-8"))
        return AppConfig(**{**asdict(AppConfig()), **payload})

    def save(self, config: AppConfig) -> None:
        self._config_path.write_text(json.dumps(asdict(config), ensure_ascii=False, indent=2), encoding="utf-8")
```

- [ ] **Step 4: 运行单测确认通过**

Run: `pytest tests/test_config_service.py::test_load_defaults_and_save_roundtrip -v`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/filebox/config/models.py src/filebox/config/service.py tests/test_config_service.py
git commit -m "feat: add config load/save service with defaults"
```

### Task 2: 存储模块（SQLite 历史记录）

**Files:**
- Create: `src/filebox/storage/repository.py`
- Test: `tests/test_storage_repository.py`

- [ ] **Step 1: 写失败测试（插入与倒序查询）**

```python
from pathlib import Path

from filebox.storage.repository import FileRecord, StorageRepository


def test_insert_and_list_desc(tmp_path: Path) -> None:
    repo = StorageRepository(tmp_path / "filebox.db")
    repo.init_schema()
    repo.insert_record(FileRecord(file_name="a.pdf", file_path=r"C:\\A\\a.pdf", source_type="wechat", received_at=1))
    repo.insert_record(FileRecord(file_name="b.pdf", file_path=r"C:\\B\\b.pdf", source_type="qq", received_at=2))

    rows = repo.list_records()
    assert [r.file_name for r in rows] == ["b.pdf", "a.pdf"]
```

- [ ] **Step 2: 运行单测确认失败**

Run: `pytest tests/test_storage_repository.py::test_insert_and_list_desc -v`
Expected: FAIL with `ModuleNotFoundError` or missing class errors

- [ ] **Step 3: 写最小实现**

```python
from dataclasses import dataclass
import sqlite3
from pathlib import Path


@dataclass
class FileRecord:
    file_name: str
    file_path: str
    source_type: str
    received_at: int


class StorageRepository:
    def __init__(self, db_path: Path) -> None:
        self._db_path = db_path

    def init_schema(self) -> None:
        with sqlite3.connect(self._db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS file_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    file_name TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    source_type TEXT NOT NULL,
                    received_at INTEGER NOT NULL
                )
                """
            )

    def insert_record(self, record: FileRecord) -> None:
        with sqlite3.connect(self._db_path) as conn:
            conn.execute(
                "INSERT INTO file_records (file_name, file_path, source_type, received_at) VALUES (?, ?, ?, ?)",
                (record.file_name, record.file_path, record.source_type, record.received_at),
            )

    def list_records(self) -> list[FileRecord]:
        with sqlite3.connect(self._db_path) as conn:
            rows = conn.execute(
                "SELECT file_name, file_path, source_type, received_at FROM file_records ORDER BY received_at DESC"
            ).fetchall()
        return [FileRecord(*row) for row in rows]
```

- [ ] **Step 4: 运行单测确认通过**

Run: `pytest tests/test_storage_repository.py::test_insert_and_list_desc -v`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/filebox/storage/repository.py tests/test_storage_repository.py
git commit -m "feat: add sqlite repository for file history"
```

### Task 3: watcher 事件处理（过滤/标准化/去抖）

**Files:**
- Create: `src/filebox/watcher/events.py`
- Create: `src/filebox/watcher/processor.py`
- Test: `tests/test_watcher_processor.py`

- [ ] **Step 1: 写失败测试（扩展名过滤与重复事件）**

```python
from filebox.watcher.processor import EventProcessor


def test_accept_extension_and_drop_duplicates() -> None:
    processor = EventProcessor(watch_extensions=[".pdf"], dedup_window_seconds=3)
    assert processor.should_record(r"C:\\A\\demo.pdf", now_ts=100) is True
    assert processor.should_record(r"C:\\A\\demo.pdf", now_ts=101) is False
    assert processor.should_record(r"C:\\A\\demo.txt", now_ts=102) is False
```

- [ ] **Step 2: 运行单测确认失败**

Run: `pytest tests/test_watcher_processor.py::test_accept_extension_and_drop_duplicates -v`
Expected: FAIL with missing module/class

- [ ] **Step 3: 写最小实现**

```python
from dataclasses import dataclass


# src/filebox/watcher/events.py
@dataclass(frozen=True)
class NewFileEvent:
    file_name: str
    file_path: str
    source_type: str
    received_at: int


# src/filebox/watcher/processor.py
from pathlib import Path


class EventProcessor:
    def __init__(self, watch_extensions: list[str], dedup_window_seconds: int = 3) -> None:
        self._extensions = {ext.lower() for ext in watch_extensions}
        self._dedup_window_seconds = dedup_window_seconds
        self._last_seen: dict[str, int] = {}

    def should_record(self, file_path: str, now_ts: int) -> bool:
        ext = Path(file_path).suffix.lower()
        if ext not in self._extensions:
            return False

        normalized = str(Path(file_path).resolve())
        last_ts = self._last_seen.get(normalized)
        if last_ts is not None and now_ts - last_ts <= self._dedup_window_seconds:
            return False

        self._last_seen[normalized] = now_ts
        return True
```

- [ ] **Step 4: 运行单测确认通过**

Run: `pytest tests/test_watcher_processor.py::test_accept_extension_and_drop_duplicates -v`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/filebox/watcher/events.py src/filebox/watcher/processor.py tests/test_watcher_processor.py
git commit -m "feat: add watcher event processor with extension filter and dedup"
```

### Task 4: 侧边栏视图模型（不含 UI 壳）

**Files:**
- Create: `src/filebox/sidebar/view_model.py`
- Test: `tests/test_sidebar_view_model.py`

- [ ] **Step 1: 写失败测试（倒序展示与移除）**

```python
from filebox.sidebar.view_model import SidebarViewModel
from filebox.storage.repository import FileRecord


def test_sorted_items_and_remove_behavior() -> None:
    vm = SidebarViewModel()
    vm.set_records([
        FileRecord(file_name="old.pdf", file_path=r"C:\\A\\old.pdf", source_type="wechat", received_at=1),
        FileRecord(file_name="new.pdf", file_path=r"C:\\A\\new.pdf", source_type="qq", received_at=2),
    ])

    assert vm.items[0].file_name == "new.pdf"
    vm.remove_by_path(r"C:\\A\\new.pdf")
    assert [i.file_name for i in vm.items] == ["old.pdf"]
```

- [ ] **Step 2: 运行单测确认失败**

Run: `pytest tests/test_sidebar_view_model.py::test_sorted_items_and_remove_behavior -v`
Expected: FAIL with missing class

- [ ] **Step 3: 写最小实现**

```python
from dataclasses import dataclass

from filebox.storage.repository import FileRecord


@dataclass
class SidebarItem:
    file_name: str
    file_path: str
    received_at: int


class SidebarViewModel:
    def __init__(self) -> None:
        self.items: list[SidebarItem] = []

    def set_records(self, records: list[FileRecord]) -> None:
        ordered = sorted(records, key=lambda x: x.received_at, reverse=True)
        self.items = [SidebarItem(file_name=r.file_name, file_path=r.file_path, received_at=r.received_at) for r in ordered]

    def remove_by_path(self, file_path: str) -> None:
        self.items = [item for item in self.items if item.file_path != file_path]
```

- [ ] **Step 4: 运行单测确认通过**

Run: `pytest tests/test_sidebar_view_model.py::test_sorted_items_and_remove_behavior -v`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/filebox/sidebar/view_model.py tests/test_sidebar_view_model.py
git commit -m "feat: add sidebar view model with desc sorting and removal"
```

### Task 5: 应用编排（watcher -> storage -> sidebar）

**Files:**
- Create: `src/filebox/app/coordinator.py`
- Test: `tests/test_app_coordinator.py`

- [ ] **Step 1: 写失败测试（收到事件后入库并刷新）**

```python
from filebox.app.coordinator import AppCoordinator
from filebox.storage.repository import FileRecord


class FakeRepo:
    def __init__(self) -> None:
        self.rows: list[FileRecord] = []

    def insert_record(self, record: FileRecord) -> None:
        self.rows.append(record)

    def list_records(self) -> list[FileRecord]:
        return list(self.rows)


class FakeSidebar:
    def __init__(self) -> None:
        self.last_count = 0

    def refresh(self, records: list[FileRecord]) -> None:
        self.last_count = len(records)


def test_on_new_file_event_updates_repo_and_sidebar() -> None:
    repo = FakeRepo()
    sidebar = FakeSidebar()
    app = AppCoordinator(repo=repo, sidebar=sidebar)

    app.on_new_file(file_name="demo.pdf", file_path=r"C:\\A\\demo.pdf", source_type="wechat", received_at=1)
    assert len(repo.rows) == 1
    assert sidebar.last_count == 1
```

- [ ] **Step 2: 运行单测确认失败**

Run: `pytest tests/test_app_coordinator.py::test_on_new_file_event_updates_repo_and_sidebar -v`
Expected: FAIL with missing class

- [ ] **Step 3: 写最小实现**

```python
from filebox.storage.repository import FileRecord


class AppCoordinator:
    def __init__(self, repo, sidebar) -> None:
        self._repo = repo
        self._sidebar = sidebar

    def on_new_file(self, file_name: str, file_path: str, source_type: str, received_at: int) -> None:
        self._repo.insert_record(
            FileRecord(
                file_name=file_name,
                file_path=file_path,
                source_type=source_type,
                received_at=received_at,
            )
        )
        self._sidebar.refresh(self._repo.list_records())
```

- [ ] **Step 4: 运行单测确认通过**

Run: `pytest tests/test_app_coordinator.py::test_on_new_file_event_updates_repo_and_sidebar -v`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/filebox/app/coordinator.py tests/test_app_coordinator.py
git commit -m "feat: add app coordinator for file event pipeline"
```

### Task 6: 托盘与侧边栏壳层（最小可运行）

**Files:**
- Create: `src/filebox/sidebar/window.py`
- Create: `src/filebox/tray/icon.py`
- Test: `tests/test_tray_icon.py`

- [ ] **Step 1: 写失败测试（托盘菜单回调）**

```python
from filebox.tray.icon import TrayActions


def test_tray_actions_toggle_and_exit() -> None:
    calls: list[str] = []

    actions = TrayActions(
        on_toggle=lambda: calls.append("toggle"),
        on_exit=lambda: calls.append("exit"),
    )
    actions.handle_toggle()
    actions.handle_exit()

    assert calls == ["toggle", "exit"]
```

- [ ] **Step 2: 运行单测确认失败**

Run: `pytest tests/test_tray_icon.py::test_tray_actions_toggle_and_exit -v`
Expected: FAIL with missing class

- [ ] **Step 3: 写最小实现**

```python
# src/filebox/tray/icon.py
class TrayActions:
    def __init__(self, on_toggle, on_exit) -> None:
        self._on_toggle = on_toggle
        self._on_exit = on_exit

    def handle_toggle(self) -> None:
        self._on_toggle()

    def handle_exit(self) -> None:
        self._on_exit()


# src/filebox/sidebar/window.py
from PyQt5.QtWidgets import QWidget


class SidebarWindow(QWidget):
    def show_sidebar(self) -> None:
        self.show()

    def hide_sidebar(self) -> None:
        self.hide()
```

- [ ] **Step 4: 运行单测确认通过**

Run: `pytest tests/test_tray_icon.py::test_tray_actions_toggle_and_exit -v`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/filebox/sidebar/window.py src/filebox/tray/icon.py tests/test_tray_icon.py
git commit -m "feat: add tray action handlers and sidebar window shell"
```

### Task 7: 入口与集成烟测

**Files:**
- Create: `main.py`
- Modify: `README.md`
- Create: `tests/test_main_import.py`

- [ ] **Step 1: 写失败测试（入口可导入）**

```python
def test_main_module_importable() -> None:
    import main  # noqa: F401
```

- [ ] **Step 2: 运行单测确认失败**

Run: `pytest tests/test_main_import.py::test_main_module_importable -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'main'`

- [ ] **Step 3: 写最小实现与说明更新**

```python
# main.py
from pathlib import Path

from filebox.config.service import ConfigService
from filebox.storage.repository import StorageRepository


def create_app() -> tuple[ConfigService, StorageRepository]:
    config_service = ConfigService(Path("config.json"))
    storage = StorageRepository(Path("filebox.db"))
    storage.init_schema()
    return config_service, storage


if __name__ == "__main__":
    create_app()
```

```markdown
<!-- README.md 追加内容 -->
## MVP 当前范围

- 监听微信/QQ目录并记录新文件
- 侧边栏按时间倒序展示
- 托盘控制显示/隐藏和退出
- 不包含 AI 摘要、重命名、分类能力
```

- [ ] **Step 4: 运行测试与质量命令**

Run: `pytest -q`
Expected: PASS

Run: `ruff check .`
Expected: PASS

Run: `mypy .`
Expected: PASS or only known, documented warnings

- [ ] **Step 5: 提交**

```bash
git add main.py README.md
git commit -m "feat: add runnable entrypoint and document MVP scope"
```

### Task 8: watcher 服务重载与配置联动（方案 C 收口）

**Files:**
- Create: `src/filebox/watcher/service.py`
- Modify: `src/filebox/config/service.py`
- Test: `tests/test_watcher_service.py`

- [ ] **Step 1: 写失败测试（更新路径触发重载）**

```python
from filebox.watcher.service import WatcherService


def test_reload_paths_replaces_watched_set() -> None:
    service = WatcherService()
    service.reload_paths([r"C:\\A"], [r"C:\\B"])
    assert service.current_paths == {r"C:\\A", r"C:\\B"}

    service.reload_paths([r"C:\\C"], [])
    assert service.current_paths == {r"C:\\C"}
```

- [ ] **Step 2: 运行单测确认失败**

Run: `pytest tests/test_watcher_service.py::test_reload_paths_replaces_watched_set -v`
Expected: FAIL with missing class

- [ ] **Step 3: 写最小实现**

```python
# src/filebox/watcher/service.py
class WatcherService:
    def __init__(self) -> None:
        self.current_paths: set[str] = set()

    def reload_paths(self, wechat_paths: list[str], qq_paths: list[str]) -> None:
        self.current_paths = set(wechat_paths + qq_paths)


# src/filebox/config/service.py
from filebox.config.models import AppConfig


class ConfigService:
    ...

    def update_watch_paths(self, wechat_paths: list[str], qq_paths: list[str]) -> AppConfig:
        cfg = self.load()
        cfg.wechat_paths = wechat_paths
        cfg.qq_paths = qq_paths
        self.save(cfg)
        return cfg
```

- [ ] **Step 4: 运行单测确认通过**

Run: `pytest tests/test_watcher_service.py::test_reload_paths_replaces_watched_set -v`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/filebox/watcher/service.py tests/test_watcher_service.py
git commit -m "feat: add watcher path reload for config updates"
```

## 全局收尾检查

- [ ] Run: `pytest -q`
  Expected: PASS
- [ ] Run: `ruff format . && ruff check .`
  Expected: PASS
- [ ] Run: `mypy .`
  Expected: PASS or documented acceptable warnings
- [ ] 手工验证：运行 `python main.py` 后无异常退出

## 计划自检（对照 spec）

- 需求覆盖：监听、入库、倒序展示、托盘控制、配置写回与 watcher 重载、不含 AI，均有对应任务。
- 占位词扫描：无 `TODO/TBD/implement later` 等占位词。
- 命名一致性：`ConfigService`、`StorageRepository`、`EventProcessor`、`AppCoordinator`、`WatcherService` 在各任务中保持一致。
