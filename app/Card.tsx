import React, { useEffect } from "react";
import { Dimensions, Image, StyleSheet, View } from "react-native";
import type { PanGestureHandlerGestureEvent } from "react-native-gesture-handler";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedGestureHandler,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { snapPoint } from "react-native-redash";
import { Shadow } from "react-native-shadow-2";

const { width, height } = Dimensions.get("window");

const aspectRatio = 722 / 368;
const CARD_WIDTH = width - 128;
const CARD_HEIGHT = CARD_WIDTH * aspectRatio;
const IMAGE_WIDTH = CARD_WIDTH * 0.9;
const DURATION = 250;
const side = (width + CARD_WIDTH + 50) / 2;
const SNAP_POINTS = [-side, 0, width];

interface CardProps {
  card: {
    source: ReturnType<typeof require>;
  };
  index: number;
  shuffleBack: Animated.SharedValue<boolean>;
}

type Context = {
  x: number;
  y: number;
};

export const Card = ({ card: { source }, index, shuffleBack }: CardProps) => {
  const theta = Math.random() * 20 - 10;
  const x = useSharedValue(0);
  const y = useSharedValue(-height * 1.3);
  const rotateZ = useSharedValue(0);
  const scale = useSharedValue(1);
  useAnimatedReaction(
    () => shuffleBack.value,
    () => {
      if (shuffleBack.value) {
        const delay = 150 * index;
        x.value = withDelay(delay, withSpring(0));
        rotateZ.value = withDelay(
          delay,
          withSpring(theta, {}, () => {
            shuffleBack.value = false;
          })
        );
      }
    }
  );
  useEffect(() => {
    const delay = 1000 + index * DURATION;
    y.value = withDelay(
      delay,
      withTiming(0, {
        duration: DURATION,
        easing: Easing.inOut(Easing.ease),
      })
    );
    rotateZ.value = withDelay(
      delay,
      withTiming(theta, {
        duration: DURATION,
        easing: Easing.inOut(Easing.ease),
      })
    );
  }, [index, rotateZ, theta, y]);
  const onGestureEvent = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    Context
  >({
    onStart: (_, ctx) => {
      ctx.x = x.value;
      ctx.y = y.value;
      scale.value = withTiming(1.1, { easing: Easing.inOut(Easing.ease) });
      rotateZ.value = withTiming(0, { easing: Easing.inOut(Easing.ease) });
    },
    onActive: ({ translationX, translationY }, ctx) => {
      x.value = ctx.x + translationX;
      y.value = ctx.y + translationY;
    },
    onEnd: ({ velocityX, velocityY }) => {
      const dest = snapPoint(x.value, velocityX, SNAP_POINTS);
      x.value = withSpring(dest, { velocity: velocityX });
      y.value = withSpring(0, { velocity: velocityY });
      scale.value = withTiming(1, { easing: Easing.inOut(Easing.ease) }, () => {
        if (index === 0 && dest !== 0) {
          shuffleBack.value = true;
        }
      });
    },
  });
  const style = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1500 },
      { rotateX: "30deg" },
      { rotateZ: `${rotateZ.value}deg` },
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
    ],
  }));
  return (
    <View style={styles.container} pointerEvents="box-none">
      <PanGestureHandler onGestureEvent={onGestureEvent}>
        <Animated.View style={[style]}>
          <Shadow
            radius={3.84}
            viewStyle={styles.card}
            startColor={"rgba(0,0,0,0.25)"}
            offset={[0, 2]}
          >
            <Image
              source={source}
              style={{
                width: IMAGE_WIDTH,
                height: IMAGE_WIDTH * aspectRatio,
              }}
              resizeMode="contain"
            />
          </Shadow>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
});
