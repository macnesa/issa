import { useEffect, useMemo, useRef, useState } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { SecondaryButton } from "../../shared/ui/ui";
import {
  getOnlineHint,
  subscribeToConnectionStatus,
} from "../../offline-workspace/connectionStatus";
import { searchTeacherRecords } from "./teacherSearchApi";
import "./TeacherCommandPalette.css";

const EMPTY_SEARCH = {
  query: "",
  total: 0,
  groups: [],
};

const groupIcons = {
  student: "person",
  journal: "auto_stories",
  feedback: "rate_review",
  lesson: "menu_book",
  activity: "event",
};

function destinationForResult(groupType, item) {
  if (
    ["student", "journal", "feedback"].includes(groupType)
    && item.studentId
  ) {
    return `/students/${item.studentId}`;
  }
  if (groupType === "lesson") return "/schedule";
  return "/";
}

function formatResultDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function isEditableShortcutTarget(target) {
  return target instanceof Element && Boolean(target.closest(
    'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
  ));
}

export default function TeacherCommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate();
  const requestSequence = useRef(0);
  const [query, setQuery] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [isOnline, setIsOnline] = useState(getOnlineHint);
  const [resource, setResource] = useState({
    status: "idle",
    data: EMPTY_SEARCH,
    error: "",
  });
  const trimmedQuery = query.trim();

  useEffect(() => subscribeToConnectionStatus(setIsOnline), []);

  useEffect(() => {
    function handleCommandShortcut(event) {
      const isCommandShortcut = event.key.toLowerCase() === "k"
        && (event.metaKey || event.ctrlKey)
        && !event.altKey
        && !event.shiftKey;
      if (!isCommandShortcut || isEditableShortcutTarget(event.target)) return;

      event.preventDefault();
      onOpenChange(!open);
    }

    window.addEventListener("keydown", handleCommandShortcut);
    return () => window.removeEventListener("keydown", handleCommandShortcut);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!open || trimmedQuery.length < 2) {
      requestSequence.current += 1;
      setResource({
        status: "idle",
        data: EMPTY_SEARCH,
        error: "",
      });
      return undefined;
    }

    if (!isOnline) {
      requestSequence.current += 1;
      setResource({
        status: "offline",
        data: EMPTY_SEARCH,
        error: "",
      });
      return undefined;
    }

    const requestController = new AbortController();
    const requestId = ++requestSequence.current;
    const debounceTimer = window.setTimeout(() => {
      setResource((current) => ({
        ...current,
        status: "loading",
        error: "",
      }));

      searchTeacherRecords(trimmedQuery, {
        limit: 5,
        signal: requestController.signal,
      })
        .then((searchResult) => {
          if (
            requestController.signal.aborted
            || requestId !== requestSequence.current
          ) return;
          setResource({
            status: "success",
            data: searchResult,
            error: "",
          });
        })
        .catch((error) => {
          if (
            error.name === "AbortError"
            || requestId !== requestSequence.current
          ) return;
          setResource({
            status: "error",
            data: EMPTY_SEARCH,
            error: error.message || "Pencarian belum dapat digunakan.",
          });
        });
    }, 250);

    return () => {
      window.clearTimeout(debounceTimer);
      requestController.abort();
    };
  }, [isOnline, open, retryKey, trimmedQuery]);

  const resultGroups = useMemo(
    () => (
      Array.isArray(resource.data?.groups)
        ? resource.data.groups
        : []
    ),
    [resource.data]
  );

  function handleQueryChange(nextQuery) {
    requestSequence.current += 1;
    setQuery(nextQuery);
  }

  function handleOpenChange(nextOpen) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      handleQueryChange("");
      setResource({
        status: "idle",
        data: EMPTY_SEARCH,
        error: "",
      });
      window.setTimeout(() => {
        document.querySelector(
          'button[aria-label="Buka pencarian universal"]'
        )?.focus();
      }, 0);
    }
  }

  function openSearchResult(groupType, item) {
    handleOpenChange(false);
    navigate(destinationForResult(groupType, item));
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={handleOpenChange}
      label="Cari data ISSA"
      loop
      shouldFilter={false}
      overlayClassName="issa-dialog-backdrop teacher-command-palette__overlay"
      contentClassName="issa-dialog-panel teacher-command-palette"
    >
      <div className="teacher-command-palette__search-row">
        <span
          className="material-symbols-outlined teacher-command-palette__search-icon"
          aria-hidden="true"
        >
          search
        </span>
        <Command.Input
          value={query}
          onValueChange={handleQueryChange}
          placeholder="Cari siswa, jurnal, feedback, pelajaran, atau aktivitas…"
          className="teacher-command-palette__input"
        />
        <kbd className="teacher-command-palette__escape">
          ESC
        </kbd>
      </div>

      <Command.List className="teacher-command-palette__list">
        {trimmedQuery.length < 2 && (
          <div className="teacher-command-palette__prompt">
            <span
              className="material-symbols-outlined teacher-command-palette__prompt-icon"
              aria-hidden="true"
            >
              manage_search
            </span>
            <p className="teacher-command-palette__state-title">
              Ketik minimal 2 karakter
            </p>
            <p className="teacher-command-palette__state-copy">
              Hasil hanya berasal dari data yang dapat diakses akun Teacher ini.
            </p>
          </div>
        )}

        {resource.status === "loading" && (
          <Command.Loading>
            <div
              className="teacher-command-palette__loading"
              role="status"
            >
              <span
                className="teacher-command-palette__spinner"
                aria-hidden="true"
              />
              Mencari record…
            </div>
          </Command.Loading>
        )}

        {resource.status === "error" && (
          <div className="teacher-command-palette__error">
            <p className="teacher-command-palette__error-message" role="alert">
              {resource.error}
            </p>
            <SecondaryButton
              type="button"
              compact
              onClick={() => setRetryKey((current) => current + 1)}
              className="teacher-command-palette__retry"
            >
              Coba lagi
            </SecondaryButton>
          </div>
        )}

        {resource.status === "offline" && (
          <div className="teacher-command-palette__offline" role="status">
            <span
              className="material-symbols-outlined teacher-command-palette__offline-icon"
              aria-hidden="true"
            >
              cloud_off
            </span>
            <p className="teacher-command-palette__state-title">
              Pencarian membutuhkan koneksi internet.
            </p>
          </div>
        )}

        {resource.status === "success" && resultGroups.length === 0 && (
          <Command.Empty className="teacher-command-palette__empty">
            <p className="teacher-command-palette__state-title">
              Tidak ada record yang cocok
            </p>
            <p className="teacher-command-palette__state-copy">
              Coba kata kunci lain.
            </p>
          </Command.Empty>
        )}

        {resource.status === "success" && resultGroups.map((group) => (
          <Command.Group
            key={group.type}
            heading={group.label}
            className="teacher-command-palette__group"
          >
            {group.items.map((item) => (
              <Command.Item
                key={`${group.type}-${item.id}`}
                value={`${group.type}-${item.id}`}
                onSelect={() => openSearchResult(group.type, item)}
                className="teacher-command-palette__item"
              >
                <span
                  className="material-symbols-outlined teacher-command-palette__item-icon"
                  aria-hidden="true"
                >
                  {groupIcons[group.type] || "search"}
                </span>
                <span className="teacher-command-palette__item-copy">
                  <span className="teacher-command-palette__item-heading">
                    <span className="teacher-command-palette__item-title">
                      {item.title}
                    </span>
                    {item.occurredAt && (
                      <time className="teacher-command-palette__item-date">
                        {formatResultDate(item.occurredAt)}
                      </time>
                    )}
                  </span>
                  <span className="teacher-command-palette__item-subtitle">
                    {item.subtitle}
                  </span>
                  {item.snippet && (
                    <span className="teacher-command-palette__item-snippet">
                      {item.snippet}
                    </span>
                  )}
                </span>
                <span
                  className="material-symbols-outlined teacher-command-palette__item-arrow"
                  aria-hidden="true"
                >
                  arrow_forward
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        ))}
      </Command.List>

      <div className="teacher-command-palette__footer">
        <span>Hasil diurutkan oleh server</span>
        <span className="teacher-command-palette__footer-hints">
          <kbd>↑↓</kbd>
          pilih
          <kbd>↵</kbd>
          buka
        </span>
      </div>
    </Command.Dialog>
  );
}
