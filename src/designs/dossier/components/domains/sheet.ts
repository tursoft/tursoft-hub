/**
 * Class lists for detail dialogs set as paper sheets: card paper with a hairline edge, a
 * kicker, a serif title and hairline sections, over the shared tabs. Shared by the domain, skill,
 * customer and partner dialogs. They are Tailwind utilities (not CSS classes) so they win
 * over the shadcn defaults through `cn` / tailwind-merge.
 */
export const sheet = {
  /** DialogContent: the sheet itself; size classes are added per dialog. */
  content:
    'flex flex-col gap-0 overflow-hidden border-border bg-card p-0 text-foreground shadow-[var(--shadow-elegant)] sm:rounded-lg',
  /** DialogHeader: kicker, title and meta above a hairline. Leaves room for the corner buttons. */
  head: 'flex-shrink-0 space-y-0 border-b border-border px-5 pb-5 pr-24 pt-6 text-left sm:px-8 sm:pb-6 sm:pr-28 sm:pt-7',
  kicker: 'text-[13px] leading-4 text-muted-foreground',
  title: 'font-serif text-[28px] font-normal leading-8 tracking-[-0.01em] text-foreground sm:text-[32px] sm:leading-9',
  meta: 'text-sm leading-5 text-muted-foreground',
  /** Maximize / restore, beside the dialog's close button; phones get the sheet full size already. */
  cornerButton: 'absolute right-14 top-4 z-20 hidden h-8 w-8 text-faint sm:inline-flex',
  /** Tabs root and its scrolling body; the tab list keeps the shared segmented style. */
  tabs: 'flex min-h-0 flex-1 flex-col px-5 pt-4 sm:px-8',
  tabList: 'max-w-full flex-shrink-0 self-start justify-start',
  tabCount: 'tnum ml-1.5 font-normal text-faint',
  body: 'min-h-0 flex-1 overflow-y-auto pb-6 pt-1',
  /** A titled block inside a tab, opened by a hairline. */
  sectionTitle: 'text-sm font-medium leading-5 text-foreground',
  empty: 'py-8 text-sm text-muted-foreground',
} as const;
