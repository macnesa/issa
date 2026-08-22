import { tw } from "../../shared/ui/tw";
import { useEffect, useMemo, useRef, useState } from "react";
import { Command } from "cmdk";
import { Spinner } from "flowbite-react/components/Spinner";
import { useNavigate } from "react-router-dom";
import { InlineNotice, SecondaryButton } from "../../shared/ui/ui";
import Icon from "../../shared/ui/Icon";
import {
  getOnlineHint,
  subscribeToConnectionStatus,
} from "../../offline-workspace/connectionStatus";
import { searchTeacherRecords } from "./teacherSearchApi";

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
      overlayClassName={tw("issa-dialog-backdrop fixed z-dialog-backdrop inset-0 [background:var(--issa-dialog-backdrop)] [animation:issa-dialog-backdrop-in_var(--issa-motion-default)_ease_both] teacher-command-palette__overlay")}
      contentClassName={tw("issa-dialog-panel teacher-command-palette fixed left-4 right-4 top-[clamp(var(--issa-space-3),8vh,4.5rem)] z-dialog mx-auto grid w-auto max-w-[42rem] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-dialog border-emphasis border-issa-border-strong bg-issa-surface shadow-dialog [max-height:calc(100dvh_-_var(--issa-space-6))] max-[640px]:left-2 max-[640px]:right-2 max-[640px]:top-2 max-[640px]:[max-height:calc(100dvh_-_var(--issa-space-4))]")}
    >
      <div className={tw("teacher-command-palette__search-row grid h-16 min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b-emphasis border-issa-border-strong bg-issa-surface px-4 focus-within:border-b-issa-selection focus-within:[box-shadow:inset_0_calc(-1_*_var(--issa-border-width-emphasis))_0_var(--issa-selection)] max-[640px]:h-14 max-[640px]:gap-2 max-[640px]:px-3")}>
        <Icon
          name="search"
          className={tw("teacher-command-palette__search-icon flex-none text-issa-accent text-xl")}
        />
        <Command.Input
          value={query}
          onValueChange={handleQueryChange}
          placeholder="Cari data ISSA…"
          className={tw("teacher-command-palette__input h-full min-h-0 min-w-0 w-full border-0 bg-transparent p-0 text-body leading-normal text-issa-text outline-none [box-shadow:none] placeholder:text-issa-muted placeholder:opacity-100 focus:outline-none focus-visible:outline-none focus-visible:outline-offset-0")}
        />
        <kbd className={tw("teacher-command-palette__escape hidden flex-none rounded-control border border-issa-border-strong bg-issa-subtle px-2 py-1 font-sans text-metadata font-bold leading-none text-issa-muted sm:inline")}>
          ESC
        </kbd>
        <button
          type="button"
          className={tw("grid min-h-control w-control flex-none place-items-center rounded-control border border-issa-border-strong bg-issa-subtle text-issa-accent hover:border-issa-accent hover:bg-issa-page focus-visible:outline focus-visible:outline-emphasis focus-visible:outline-offset-2 focus-visible:outline-issa-focus sm:hidden")}
          aria-label="Tutup pencarian"
          onClick={() => handleOpenChange(false)}
        >
          <Icon name="close" className={tw("text-section-title")} />
        </button>
      </div>

      <Command.List className={tw("teacher-command-palette__list min-h-0 min-w-0 max-h-[min(68dvh,31rem)] overflow-x-hidden overflow-y-auto overscroll-contain p-2 max-[640px]:max-h-none")}>
        {trimmedQuery.length < 2 && (
          <div className={tw("teacher-command-palette__prompt px-4 py-12 text-center")}>
            <Icon
              name="manage_search"
              className={tw("teacher-command-palette__prompt-icon text-[1.75rem] text-issa-accent")}
            />
            <p className={tw("teacher-command-palette__state-title mt-2 text-issa-text text-body font-semibold")}>
              Ketik minimal 2 karakter
            </p>
            <p className={tw("teacher-command-palette__state-copy [max-width:46ch] [margin:var(--issa-space-1)_auto_0] text-issa-muted text-supporting leading-normal")}>
              Hasil hanya berasal dari data yang dapat diakses akun Teacher ini.
            </p>
          </div>
        )}

        {resource.status === "loading" && (
          <Command.Loading>
            <div
              className={tw("teacher-command-palette__loading flex items-center justify-center gap-2 px-4 py-12 text-center text-body font-semibold text-issa-muted")}
              role="status"
            >
              <Spinner aria-hidden="true" size="sm" />
              Mencari record…
            </div>
          </Command.Loading>
        )}

        {resource.status === "error" && (
          <InlineNotice
            className={tw("teacher-command-palette__error m-2 p-4 [&_[data-testid=flowbite-alert-wrapper]]:grid [&_[data-testid=flowbite-alert-wrapper]]:justify-items-start")}
            role="alert"
            tone="danger"
          >
            <span className={tw("teacher-command-palette__error-message font-semibold")}>
              {resource.error}
            </span>
            <SecondaryButton
              type="button"
              compact
              onClick={() => setRetryKey((current) => current + 1)}
              className={tw("teacher-command-palette__retry mt-3")}
            >
              Coba lagi
            </SecondaryButton>
          </InlineNotice>
        )}

        {resource.status === "offline" && (
          <div className={tw("teacher-command-palette__offline px-4 py-12 text-center")} role="status">
            <Icon
              name="cloud_off"
              className={tw("teacher-command-palette__offline-icon text-[1.75rem] text-issa-accent")}
            />
            <p className={tw("teacher-command-palette__state-title mt-2 text-issa-text text-body font-semibold")}>
              Pencarian membutuhkan koneksi internet.
            </p>
          </div>
        )}

        {resource.status === "success" && resultGroups.length === 0 && (
          <Command.Empty className={tw("teacher-command-palette__empty px-4 py-12 text-center")}>
            <p className={tw("teacher-command-palette__state-title text-issa-text text-body font-semibold")}>
              Tidak ada record yang cocok
            </p>
            <p className={tw("teacher-command-palette__state-copy [max-width:46ch] [margin:var(--issa-space-1)_auto_0] text-issa-muted text-supporting leading-normal")}>
              Coba kata kunci lain.
            </p>
          </Command.Empty>
        )}

        {resource.status === "success" && resultGroups.map((group) => (
          <Command.Group
            key={group.type}
            heading={group.label}
            className={tw("teacher-command-palette__group mb-2 min-w-0 overflow-hidden border-t border-issa-border first:border-t-0 [&_[cmdk-group-heading]]:border-l-option [&_[cmdk-group-heading]]:border-issa-accent [&_[cmdk-group-heading]]:bg-issa-subtle [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-table-header [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-product [&_[cmdk-group-heading]]:text-issa-accent")}
          >
            {group.items.map((item) => (
              <Command.Item
                key={`${group.type}-${item.id}`}
                value={`${group.type}-${item.id}`}
                onSelect={() => openSearchResult(group.type, item)}
                className={tw("teacher-command-palette__item mt-1 flex min-w-0 cursor-pointer items-start gap-3 rounded-surface border border-transparent border-l-accent p-3 outline-none transition-colors duration-default hover:border-l-issa-border-strong hover:bg-issa-page data-[selected=true]:border-issa-border-strong data-[selected=true]:border-l-issa-accent data-[selected=true]:bg-issa-subtle data-[selected=true]:text-issa-text data-[selected=true]:[&_.teacher-command-palette__item-icon]:border-issa-border-strong data-[selected=true]:[&_.teacher-command-palette__item-icon]:bg-issa-surface data-[selected=true]:[&_.teacher-command-palette__item-icon]:text-issa-text data-[selected=true]:[&_.teacher-command-palette__item-arrow]:opacity-100 motion-reduce:transition-none max-[640px]:gap-2 max-[640px]:px-2 max-[640px]:py-3")}
              >
                <Icon
                  name={groupIcons[group.type] || "search"}
                  className={tw("teacher-command-palette__item-icon grid [width:var(--issa-control-height-compact)] [height:var(--issa-control-height-compact)] [flex:0_0_var(--issa-control-height-compact)] place-items-center [margin-top:0.125rem] border border-issa-border rounded-control bg-issa-subtle text-issa-accent [font-size:1.125rem]")}
                />
                <span className={tw("teacher-command-palette__item-copy min-w-0 flex-1")}>
                  <span className={tw("teacher-command-palette__item-heading flex min-w-0 flex-wrap items-baseline justify-between [gap:var(--issa-space-1)_var(--issa-space-3)]")}>
                    <span className={tw("teacher-command-palette__item-title min-w-0 [overflow-wrap:anywhere] text-issa-text font-semibold")}>
                      {item.title}
                    </span>
                    {item.occurredAt && (
                      <time className={tw("teacher-command-palette__item-date flex-none text-issa-muted text-metadata")}>
                        {formatResultDate(item.occurredAt)}
                      </time>
                    )}
                  </span>
                  <span className={tw("teacher-command-palette__item-subtitle mt-1 block [overflow-wrap:anywhere] text-supporting font-semibold text-issa-muted")}>
                    {item.subtitle}
                  </span>
                  {item.snippet && (
                    <span className={tw("teacher-command-palette__item-snippet mt-1 block overflow-hidden text-ellipsis whitespace-nowrap [overflow-wrap:anywhere] text-supporting leading-normal text-issa-muted max-[640px]:whitespace-normal max-[640px]:text-clip")}>
                      {item.snippet}
                    </span>
                  )}
                </span>
                <Icon
                  name="arrow_forward"
                  className={tw("teacher-command-palette__item-arrow mt-2 flex-none text-base text-issa-muted opacity-0 transition-opacity duration-fast motion-reduce:transition-none")}
                />
              </Command.Item>
            ))}
          </Command.Group>
        ))}
      </Command.List>

      <div className={tw("teacher-command-palette__footer flex min-w-0 items-center justify-between gap-3 border-t border-issa-border-strong bg-issa-subtle px-4 py-2 text-metadata text-issa-muted [overflow-wrap:anywhere] [&_kbd]:rounded-control [&_kbd]:border [&_kbd]:border-issa-border-strong [&_kbd]:bg-issa-surface [&_kbd]:px-1 [&_kbd]:py-0.5 [&_kbd]:font-sans [&_kbd]:text-metadata [&_kbd]:font-bold [&_kbd]:leading-none [&_kbd]:text-issa-text")}>
        <span>Hasil diurutkan oleh server</span>
        <span className={tw("teacher-command-palette__footer-hints hidden flex-none items-center gap-2 sm:flex")}>
          <span className={tw("inline-flex gap-1")}><kbd>↑</kbd><kbd>↓</kbd></span>
          pilih
          <kbd>↵</kbd>
          buka
        </span>
      </div>
    </Command.Dialog>
  );
}
