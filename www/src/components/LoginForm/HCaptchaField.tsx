import React, { forwardRef } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { Box, Skeleton, Text } from "@radix-ui/themes";
import { FieldError } from "react-hook-form";

/**
 * Componente HCaptchaField
 *
 * Implementa HCaptcha para verificar que la interacción es humana.
 *
 * @param {string} sitekey - La clave del sitio proporcionada por HCaptcha.
 * @param {function} setToken - Función para establecer el token de verificación.
 * @param {FieldError} error - Error del campo, si existe.
 */
export const HCaptchaField = forwardRef<
  HCaptcha,
  {
    sitekey: string;
    setToken: (value: string) => void;
    error?: FieldError;
  }
>(({ sitekey, setToken, error }, ref) => (
  <Box mb="5">
    <Box
      height="78px"
      style={{ borderRadius: "5px" }}
      className="hcaptcha-container"
      overflow="hidden"
      suppressHydrationWarning
      position="relative"
    >
      <Skeleton
        height="100%"
        width="100%"
        style={{ position: "absolute" }}
      />
      <HCaptcha
        sitekey={sitekey}
        onVerify={(token: string) => setToken(token)}
        onExpire={() => setToken("")}
        ref={ref}
      />
    </Box>
    {error && (
      <Text as="div" size="1" mt="1" color="red">
        {error.message}
      </Text>
    )}
  </Box>
));

HCaptchaField.displayName = "HCaptchaField";