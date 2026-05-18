import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { UI_COLORS, MD3_SHAPE, MD3_ELEVATION } from '@/constants/ui-tokens';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm?: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: 'rgba(25, 28, 29, 0.32)' }}>
        <View
          className="w-full p-6"
          style={{
            backgroundColor: UI_COLORS.surface,
            borderRadius: MD3_SHAPE.xxl,
            ...MD3_ELEVATION.level3,
          }}
        >
          <Text className="font-grotesk-bold text-[22px] text-center" style={{ color: UI_COLORS.textPrimary, letterSpacing: -0.25 }}>
            {title}
          </Text>
          <Text className="font-jetbrain text-[13px] mt-2 text-center leading-5" style={{ color: UI_COLORS.textSecondary }}>
            {message}
          </Text>

          {onConfirm ? (
            <View className="flex-row justify-end gap-2 mt-6">
              <Pressable
                onPress={onCancel}
                className="px-6 py-2.5"
                style={{ borderRadius: MD3_SHAPE.full }}
              >
                <Text className="font-jetbrain-bold text-[13px]" style={{ color: UI_COLORS.link, letterSpacing: 0.25 }}>
                  {cancelLabel}
                </Text>
              </Pressable>
              <Pressable
                onPress={onConfirm}
                className="px-6 py-2.5"
                style={{
                  borderRadius: MD3_SHAPE.full,
                  backgroundColor: destructive ? UI_COLORS.danger : UI_COLORS.link,
                }}
              >
                <Text className="font-jetbrain-bold text-[13px]" style={{ color: '#FFFFFF', letterSpacing: 0.25 }}>
                  {confirmLabel}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={onCancel}
              className="px-6 py-2.5 mt-6"
              style={{ borderRadius: MD3_SHAPE.full, backgroundColor: UI_COLORS.link }}
            >
              <Text className="font-jetbrain-bold text-[13px] text-center" style={{ color: '#FFFFFF', letterSpacing: 0.25 }}>
                OK
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}
