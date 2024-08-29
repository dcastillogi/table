import { Button, Flex } from "@radix-ui/themes";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

/**
 * Componente SubmitButtons
 *
 * Renderiza los botones de enviar y cambiar entre modos (login/create).
 *
 * @param {function} setType - Función para cambiar el tipo de acción (login o create).
 * @param {"login" | "create"} type - Indica si el formulario está en modo 'login' o 'create'.
 * @param {boolean} loading - Indica si el formulario está en proceso de envío.
 */
export const SubmitButtons = ({
  setType,
  type,
  loading,
}: {
  setType: React.Dispatch<React.SetStateAction<"login" | "create">>;
  type: "login" | "create";
  loading: boolean;
}) => (
  <Flex mt="4" gap="2" justify="end">
    <AnimatePresence mode="wait">
      <motion.div
        key={type}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          variant="soft"
          type="button"
          onClick={() => setType(type === "login" ? "create" : "login")}
          disabled={loading}
        >
          {type === "login" ? "Create new table" : "Login"}
        </Button>
      </motion.div>
    </AnimatePresence>
    <AnimatePresence mode="wait">
      <motion.div
        key={type}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <Button type="submit" loading={loading}>
          {type === "login" ? "Login" : "Create new table"}
        </Button>
      </motion.div>
    </AnimatePresence>
  </Flex>
);