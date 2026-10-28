import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';

interface LiquidGlassSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  accentColor: string;
  trackBgColor?: string;
  onChange: (val: number) => void;
  showTicks?: boolean;
}

export const LiquidGlassSlider: React.FC<LiquidGlassSliderProps> = ({
  value,
  min,
  max,
  step = 1,
  accentColor,
  trackBgColor = '#EAECEF',
  onChange,
  showTicks = false,
}) => {
  const containerRef = useRef<any>(null);
  const [sliderWidth, setSliderWidth] = useState(0);
  const sliderWidthRef = useRef(0);
  const pageXRef = useRef(0);

  // Keep latest props in refs to avoid stale closures in PanResponder
  const minRef = useRef(min);
  const maxRef = useRef(max);
  const stepRef = useRef(step);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);

  useEffect(() => {
    minRef.current = min;
    maxRef.current = max;
    stepRef.current = step;
    onChangeRef.current = onChange;
    valueRef.current = value;
  }, [min, max, step, onChange, value]);

  const measurePosition = (cb?: () => void) => {
    containerRef.current?.measure(
      (
        x: number,
        y: number,
        width: number,
        height: number,
        pageX: number,
        pageY: number
      ) => {
        if (width > 0) {
          setSliderWidth(width);
          sliderWidthRef.current = width;
        }
        if (typeof pageX === 'number') {
          pageXRef.current = pageX;
        }
        cb?.();
      }
    );
  };

  const handleTouch = (fingerPageX: number) => {
    const w = sliderWidthRef.current;
    if (w <= 0) return;
    const originX = pageXRef.current;
    const relativeX = Math.max(0, Math.min(w, fingerPageX - originX));
    const ratio = relativeX / w;
    const mn = minRef.current;
    const mx = maxRef.current;
    const stp = stepRef.current;

    const rawVal = mn + ratio * (mx - mn);
    const steppedVal = Math.round((rawVal - mn) / stp) * stp + mn;
    const finalVal = Math.max(mn, Math.min(mx, steppedVal));

    if (finalVal !== valueRef.current) {
      valueRef.current = finalVal;
      onChangeRef.current(finalVal);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const pageX = evt.nativeEvent.pageX;
        measurePosition(() => {
          handleTouch(pageX);
        });
      },

      onPanResponderMove: (
        evt: GestureResponderEvent,
        _gestureState: PanResponderGestureState
      ) => {
        handleTouch(evt.nativeEvent.pageX);
      },

      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (evt: GestureResponderEvent) => {
        handleTouch(evt.nativeEvent.pageX);
      },
    })
  ).current;

  // Fraction 0..1
  const ratio = max > min ? (value - min) / (max - min) : 0;
  const thumbWidth = 40; // distinctly wider capsule handle
  const thumbHeight = 26;
  const halfThumb = thumbWidth / 2;
  const thumbX = sliderWidth > 0 ? ratio * sliderWidth : 0;
  const clampedThumbLeft = Math.max(
    0,
    Math.min(Math.max(0, sliderWidth - thumbWidth), thumbX - halfThumb)
  );

  // Ticks
  const numSteps = Math.round((max - min) / step);
  const tickIndices = Array.from({ length: numSteps + 1 }, (_, i) => min + i * step);

  return (
    <View
      ref={containerRef}
      style={styles.container}
      onLayout={() => measurePosition()}
      {...panResponder.panHandlers}
    >
      {/* Track Groove (Fully rounded capsule) */}
      <View
        style={[styles.track, { backgroundColor: trackBgColor }]}
        pointerEvents="none"
      >
        {/* Active Fill (Fully rounded capsule) */}
        <View
          style={[
            styles.activeFill,
            {
              width: `${Math.min(100, Math.max(0, ratio * 100))}%`,
              backgroundColor: accentColor,
            },
          ]}
        />
      </View>

      {/* Ticks (subtle dots) */}
      {showTicks && sliderWidth > 0 && numSteps <= 6 && (
        <View style={styles.ticksOverlay} pointerEvents="none">
          {tickIndices.map((tVal) => {
            const tRatio = (tVal - min) / (max - min);
            const isFilled = tVal <= value;
            return (
              <View
                key={tVal}
                style={[
                  styles.tickDot,
                  {
                    left: tRatio * sliderWidth - 2,
                    backgroundColor: isFilled ? 'rgba(255,255,255,0.85)' : '#CBD2D9',
                  },
                ]}
              />
            );
          })}
        </View>
      )}

      {/* Fully Rounded Liquid Glass Handle (30x28, transparent blur .3, no white inner rectangle) */}
      {sliderWidth > 0 && (
        <View
          style={[
            styles.glassThumb,
            {
              left: clampedThumbLeft,
              width: thumbWidth,
              height: thumbHeight,
            },
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 38,
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 2,
  },
  track: {
    height: 10,
    borderRadius: 9999, // fully rounded pill
    overflow: 'hidden',
    position: 'relative',
  },
  activeFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 9999, // fully rounded pill
  },
  ticksOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  tickDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  glassThumb: {
    position: 'absolute',
    top: 5,
    borderRadius: 9999, // fully rounded capsule/pill
    backgroundColor: 'rgba(255, 255, 255, 0.35)', // transparent background with blur .3
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 4,
  },
});
