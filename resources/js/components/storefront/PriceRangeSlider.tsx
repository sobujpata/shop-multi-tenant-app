import { useMemo } from 'react';
import { money } from './types';

export default function PriceRangeSlider({
    min,
    max,
    valueMin,
    valueMax,
    onChange,
}: {
    min: number;
    max: number;
    valueMin: number;
    valueMax: number;
    onChange: (minimum: number, maximum: number) => void;
}) {
    const safeMax = Math.max(max, min + 1);
    const left = useMemo(
        () => ((valueMin - min) / (safeMax - min)) * 100,
        [min, safeMax, valueMin],
    );
    const right = useMemo(
        () => ((valueMax - min) / (safeMax - min)) * 100,
        [min, safeMax, valueMax],
    );

    return (
        <div className="space-y-4">
            <div className="relative h-6">
                <div className="absolute top-2.5 right-0 left-0 h-1.5 rounded-full bg-muted" />
                <div
                    className="absolute top-2.5 h-1.5 rounded-full bg-primary"
                    style={{ left: `${left}%`, right: `${100 - right}%` }}
                />
                <input
                    aria-label="Minimum price"
                    type="range"
                    min={min}
                    max={safeMax}
                    value={valueMin}
                    onChange={(event) =>
                        onChange(
                            Math.min(Number(event.target.value), valueMax),
                            valueMax,
                        )
                    }
                    className="range-thumb pointer-events-none absolute inset-0 size-full appearance-none bg-transparent"
                />
                <input
                    aria-label="Maximum price"
                    type="range"
                    min={min}
                    max={safeMax}
                    value={valueMax}
                    onChange={(event) =>
                        onChange(
                            valueMin,
                            Math.max(Number(event.target.value), valueMin),
                        )
                    }
                    className="range-thumb pointer-events-none absolute inset-0 size-full appearance-none bg-transparent"
                />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{money(valueMin)}</span>
                <span>{money(valueMax)}</span>
            </div>
            <style>{`
                .range-thumb::-webkit-slider-thumb { pointer-events: auto; appearance: none; width: 16px; height: 16px; border-radius: 9999px; background: var(--primary); border: 3px solid var(--background); box-shadow: 0 0 0 1px var(--primary); cursor: grab; }
                .range-thumb::-moz-range-thumb { pointer-events: auto; width: 10px; height: 10px; border-radius: 9999px; background: var(--primary); border: 3px solid var(--background); box-shadow: 0 0 0 1px var(--primary); cursor: grab; }
            `}</style>
        </div>
    );
}
