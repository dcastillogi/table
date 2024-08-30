"use client";

import { Callout, Card, Flex, Heading } from "@radix-ui/themes";
import React, { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { HCaptchaField } from "./HCaptchaField";
import { SubmitButtons } from "./SubmitButtons";
import { ModeToggle } from "@/components/ModeToggle";
import { motion } from "framer-motion";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { AppError, LoginValues, Table } from "@/lib/types";
import { useForm, SubmitHandler } from "react-hook-form";
import Input from "../ui/Input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { createHandler } from "@/lib/loginHandler";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * LoginForm Component
 *
 * Este componente maneja la autenticación de usuarios a través de un formulario que permite ingresar a una tabla
 * mediante un ID de tabla y una contraseña. El formulario también cuenta con la validación de captcha para mayor seguridad.
 *
 * @param {function} setTable - Función para establecer la tabla actual a través del estado.
 */

export default function LoginForm({
    setTable,
    handleDataRetrieval,
}: {
    setTable: React.Dispatch<React.SetStateAction<Table | null>>;
    handleDataRetrieval: (data: LoginValues) => Promise<{
        status: string;
        errorName?: string;
        errorMessage?: string;
    }>;
}) {
    const [type, setType] = React.useState<"login" | "create">("login");
    const [appError, setAppError] = React.useState<AppError | null>(null);
    const hcaptchaRef = React.useRef<HCaptcha>(null);

    // Setup searchParams to get the table ID from the URL and set it as the default value
    const searchParams = useSearchParams();

    // ================= FORM SETUP =================

    // Define the form schema
    const formSchema = z
        .object({
            tableId: z.string().min(3, {
                message: "Your table ID is required",
            }),
            password: z.string().min(3, {
                message: "Your password is required",
            }),
            confirmPassword: z.string().optional(),
            hCaptchaToken: z.string().min(1, {
                message: "Please complete the captcha",
            }),
        })
        .refine(
            (data) => {
                if (type === "create") {
                    return data.password === data.confirmPassword;
                }
                return true;
            },
            {
                message: "Passwords must match",
                path: ["confirmPassword"],
            }
        );

    // Initialize the form
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
        reset,
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            hCaptchaToken: "",
        },
    });

    // Reset the form and error message when the type changes
    useEffect(() => {
        reset();
        setAppError(null);
    }, [reset, type]);

    // Handle form submission
    const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (
        data
    ) => {
        try {
            if (type === "login") {
                const response = await handleDataRetrieval(data);
                if (response.status === "error") {
                    setAppError({
                        name: response.errorName!,
                        message: response.errorMessage!,
                    });
                } else {
                    setTable({
                        tableId: data.tableId,
                        columns: [],
                        rows: [],
                        totalRows: 0,
                    });
                }
            } else if (type === "create") {
                const response = await createHandler(data);
                if (response.status === "error") {
                    setAppError({
                        name: response.errorName,
                        message: response.errorMessage,
                    });
                } else {
                    setTable({
                        tableId: data.tableId,
                        columns: [],
                        rows: [],
                        totalRows: 0,
                    });
                }
            }
        } catch (error) {
        } finally {
            hcaptchaRef.current?.resetCaptcha();
            reset();
        }
    };

    // ================= END FORM SETUP =================

    return (
        <Card size="4" style={{ width: 366 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Flex justify="between" align="center" mb="5">
                    <Heading as="h3" size="6" mb="-2" trim="start">
                        <AnimatePresence>
                            {type == "create" && (
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: 80 }}
                                    exit={{ width: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{
                                        overflow: "hidden",
                                        display: "inline-block",
                                    }}
                                >
                                    Create
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div
                            style={{
                                display: "inline-block",
                                overflow: "hidden",
                            }}
                        >
                            Table
                        </div>
                    </Heading>
                    <ModeToggle />
                </Flex>

                {
                    // Show error message
                    appError && (
                        <Callout.Root color="red" role="alert" mb="4" mt="-2">
                            <Callout.Icon>
                                <ExclamationTriangleIcon />
                            </Callout.Icon>
                            <Callout.Text>{appError.message}</Callout.Text>
                        </Callout.Root>
                    )
                }

                <Suspense
                    fallback={
                        <Input
                            isSubmitting={isSubmitting}
                            label="Table ID"
                            placeholder="Enter your table Id"
                            boxProps={{ mb: "4" }}
                            defaultMessage="Is like your username 😉"
                            error={errors.tableId}
                            register={register("tableId", { required: true })}
                        />
                    }
                >
                    <Input
                        isSubmitting={isSubmitting}
                        label="Table ID"
                        placeholder="Enter your table Id"
                        boxProps={{ mb: "4" }}
                        defaultMessage="Is like your username 😉"
                        error={errors.tableId}
                        inputProps={{
                            defaultValue:
                                searchParams.get("id") && type == "login"
                                    ? searchParams.get("id")!
                                    : undefined,
                        }}
                        register={register("tableId", { required: true })}
                    />
                </Suspense>
                <Input
                    isSubmitting={isSubmitting}
                    label="Password"
                    placeholder="Enter your password"
                    error={errors.password}
                    boxProps={{ mb: type == "create" ? "4" : "5" }}
                    inputProps={{ type: "password" }}
                    register={register("password", { required: true })}
                />
                <AnimatePresence>
                    {type === "create" && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{
                                height: errors.confirmPassword ? 96 : 78,
                            }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Input
                                isSubmitting={isSubmitting}
                                label="Confirm Password"
                                placeholder="Enter your password again"
                                error={errors.confirmPassword}
                                register={register("confirmPassword", {
                                    required: "Please confirm your password",
                                })}
                                inputProps={{ type: "password" }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
                <HCaptchaField
                    error={errors.hCaptchaToken}
                    sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
                    setToken={(hCaptchaToken: string) =>
                        setValue("hCaptchaToken", hCaptchaToken)
                    }
                    ref={hcaptchaRef}
                />
                <SubmitButtons
                    loading={isSubmitting}
                    setType={setType}
                    type={type}
                />
            </form>
        </Card>
    );
}
