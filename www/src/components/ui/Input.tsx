import { Box, BoxProps, Text, TextField } from "@radix-ui/themes";
import { ComponentPropsWithoutRef } from "react";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";

/**
 * Input component for forms with integrated error handling and styling.
 * 
 * @param props - The properties for the Input component.
 * @param props.defaultMessage - Optional default message to display when there's no error.
 * @param props.isSubmitting - Optional flag to indicate if the form is submitting.
 * @param props.label - The label for the input field.
 * @param props.placeholder - The placeholder text for the input field.
 * @param props.error - Optional error object from react-hook-form.
 * @param props.register - The register object from react-hook-form.
 * @param props.boxProps - Optional props for the outer Box component.
 * @param props.inputProps - Optional props for the TextField.Input component.
 * @returns A styled input component with error handling.
 */
export default function Input({
  defaultMessage,
  isSubmitting,
  label,
  placeholder,
  error,
  register,
  boxProps,
  inputProps,
}: {
  defaultMessage?: string;
  isSubmitting?: boolean;
  label: string;
  placeholder: string;
  error?: FieldError;
  register: UseFormRegisterReturn;
  boxProps?: ComponentPropsWithoutRef<typeof Box>;
  inputProps?: ComponentPropsWithoutRef<typeof TextField.Root>;
}) {
  return (
    <Box {...boxProps}>
      <label>
        <Text as="div" size="2" weight="medium" mb="1">
          {label}
        </Text>
      </label>
      <TextField.Root
        placeholder={placeholder}
        disabled={isSubmitting}
        {...register}
        {...inputProps}
      />
      {(error || defaultMessage) && (
        <Text as="div" size="1" mt="1" color={error ? "red" : undefined}>
          {error ? error.message : defaultMessage}
        </Text>
      )}
    </Box>
  );
}