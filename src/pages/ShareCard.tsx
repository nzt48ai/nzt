import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import SetupShareCard from '@/components/share/SetupShareCard';
import ReplayShareCard from '@/components/share/ReplayShareCard';
import JournalShareCard from '@/components/share/JournalShareCard';
import type { ShareCardMode, DisplayMode, JournalPeriod, JournalExportMode } from '@/types/trade';
import { MOCK_TRADE, MOCK_JOURNAL_SUMMARIES, shareBlob } from '@/lib/shareUtils';
import html2canvas from 'html2canvas';

const MODES: ShareCardMode[] = ['SETUP', 'REPLAY', 'JOURNAL'];
const DISPLAY_MODES: DisplayMode[] = ['$', 'Points'];
const JOURNAL_PERIODS: JournalPeriod[] = ['day', 'week', 'month'];
const JOURNAL_EXPORT_MODES: JournalExportMode[] = ['Static', 'Animated'];

const springNav = { type: 'spring' as const, stiffness: 380, damping: 30, mass: 0.8 };

export default function ShareCard() {
  const [mode, setMode] = useState<ShareCardMode>('SETUP');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('$');
  const [journalPeriod, setJournalPeriod] = useState<JournalPeriod>('day');
  const [journalExportMode, setJournalExportMode] = useState<JournalExportMode>('Static');
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const modeIndex = MODES.indexOf(mode);
  const displayIndex = DISPLAY_MODES.indexOf(displayMode);

  const handleShare = useCallback(async () => {
    if (!cardRef.current || sharing) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 1080 / cardRef.current.offsetWidth,
        backgroundColor: null,
        useCORS: true,
      });
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/png')
      );
      const filename = `helix-${mode.toLowerCase()}-${Date.now()}.png`;
      await shareBlob(blob, filename);
    } catch (e) {
      console.error('Share failed:', e);
    } finally {
      setSharing(false);
    }
  }, [mode, sharing]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-xl font-bold text-gradient">Share Card</h1>
      </motion.div>

      {/* Mode Selector - matches instrument selector style */}
      <SegmentedControl
        items={MODES}
        activeIndex={modeIndex}
        layoutId="share-mode-pill"
        onSelect={(i) => setMode(MODES[i])}
      />

      {/* Card Preview */}
      <div className="w-full aspect-square overflow-hidden rounded-2xl border border-[hsl(var(--glass-border))]">
        <div ref={cardRef} className="w-full h-full">
          {mode === 'SETUP' && (
            <SetupShareCard trade={MOCK_TRADE} displayMode={displayMode} />
          )}
          {mode === 'REPLAY' && (
            <ReplayShareCard trade={MOCK_TRADE} displayMode={displayMode} autoPlay />
          )}
          {mode === 'JOURNAL' && (
            <JournalShareCard
              summary={MOCK_JOURNAL_SUMMARIES[journalPeriod]}
              displayMode={displayMode}
              exportMode={journalExportMode}
              autoPlay
            />
          )}
        </div>
      </div>

      {/* Display Mode Toggle */}
      <SegmentedControl
        items={DISPLAY_MODES}
        activeIndex={displayIndex}
        layoutId="display-mode-pill"
        onSelect={(i) => setDisplayMode(DISPLAY_MODES[i])}
        small
      />

      {/* Journal-specific controls */}
      {mode === 'JOURNAL' && (
        <div className="space-y-3">
          <SegmentedControl
            items={JOURNAL_PERIODS.map((p) => p.charAt(0).toUpperCase() + p.slice(1))}
            activeIndex={JOURNAL_PERIODS.indexOf(journalPeriod)}
            layoutId="journal-period-pill"
            onSelect={(i) => setJournalPeriod(JOURNAL_PERIODS[i])}
            small
          />
          <SegmentedControl
            items={JOURNAL_EXPORT_MODES}
            activeIndex={JOURNAL_EXPORT_MODES.indexOf(journalExportMode)}
            layoutId="journal-export-pill"
            onSelect={(i) => setJournalExportMode(JOURNAL_EXPORT_MODES[i])}
            small
          />
        </div>
      )}

      {/* Share Button */}
      <motion.button
        onClick={handleShare}
        disabled={sharing}
        className="w-full flex items-center justify-center gap-2 rounded-full py-3.5 font-bold text-sm text-primary-foreground transition-colors"
        style={{
          background: 'hsl(var(--primary))',
          boxShadow: '0 4px 20px hsl(var(--primary) / 0.3)',
        }}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
      >
        <Share2 size={18} />
        {sharing ? 'Exporting…' : 'Share'}
      </motion.button>
    </div>
  );
}

/* Reusable segmented control matching the instrument/bottom nav style */
function SegmentedControl({
  items,
  activeIndex,
  layoutId,
  onSelect,
  small,
}: {
  items: string[];
  activeIndex: number;
  layoutId: string;
  onSelect: (i: number) => void;
  small?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-full px-1.5 ${small ? 'py-1' : 'py-2'}`}
      style={{
        background: 'hsl(var(--glass-bg))',
        border: '1px solid hsl(var(--glass-border))',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: '0 8px 32px hsl(220 30% 10% / 0.1), inset 0 1px 0 hsl(0 0% 100% / 0.5)',
      }}
    >
      <div className="flex items-center relative">
        {activeIndex >= 0 && (
          <motion.div
            layoutId={layoutId}
            className="absolute rounded-full pointer-events-none"
            style={{
              background: 'hsl(var(--primary) / 0.12)',
              border: '1px solid hsl(var(--primary) / 0.25)',
              boxShadow: '0 0 16px hsl(var(--primary) / 0.2), 0 0 4px hsl(var(--primary) / 0.1)',
              width: `${100 / items.length}%`,
              left: `${(activeIndex / items.length) * 100}%`,
              top: 0,
              bottom: 0,
            }}
            transition={springNav}
          />
        )}
        {items.map((item, i) => {
          const active = activeIndex === i;
          return (
            <motion.button
              key={item}
              onClick={() => onSelect(i)}
              className={`relative flex items-center justify-center flex-1 rounded-full ${small ? 'py-1.5 text-xs' : 'py-1.5 text-sm'} font-bold transition-colors duration-200 ${active ? 'text-primary' : 'text-muted-foreground'}`}
              whileTap={{ scale: 0.85 }}
            >
              <span className="relative z-10">{item}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
