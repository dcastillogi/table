import React, { useEffect, Suspense } from "react";
import { Callout, Card, Flex, Heading, Spinner } from "@radix-ui/themes";
import { AnimatePresence, motion } from "framer-motion";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useSearchParams } from "next/navigation";

import { HCaptchaField } from "./HCaptchaField";
import { SubmitButtons } from "./SubmitButtons";
import { ModeToggle } from "@/components/ModeToggle";
import Input from "../ui/Input";
import { AppError, LoginValues, Table } from "@/lib/types";
import { createHandler } from "@/lib/loginHandler";

// Base schema without the conditional validation
const baseSchema = z.object({
    tableId: z.string().min(3, { message: "Your table ID is required" }),
    password: z.string().min(3, { message: "Your password is required" }),
    confirmPassword: z.string().optional(),
    hCaptchaToken: z.string().min(1, { message: "Please complete the captcha" }),
});

// Type for the form values
type FormValues = z.infer<typeof baseSchema>;

const LoginFormContent = ({
    setTable,
    handleDataRetrieval
}: {
    setTable: React.Dispatch<React.SetStateAction<Table | null>>;
    handleDataRetrieval: (data: LoginValues) => Promise<{
        status: string;
        errorName?: string;
        errorMessage?: string;
    }>;
}) => {
    const [type, setType] = React.useState<"login" | "create">("login");
    const [appError, setAppError] = React.useState<AppError | null>(null);
    const hcaptchaRef = React.useRef<HCaptcha>(null);
    const searchParams = useSearchParams();

    // Create a memoized schema that depends on the 'type' state
    const schema = React.useMemo(() => {
        return type === "create"
            ? baseSchema.refine(
                  (data) => data.password === data.confirmPassword,
                  {
                      message: "Passwords must match",
                      path: ["confirmPassword"],
                  }
              )
            : baseSchema;
    }, [type]);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
        reset,
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            hCaptchaToken: "",
            tableId: searchParams.get("id") || "",
        },
    });

    useEffect(() => {
        reset();
        setAppError(null);
    }, [reset, type]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        try {
            if (type === "login") {
                const response = await handleDataRetrieval(data);
                if (response.status === "error") {
                    setAppError({
                        name: response.errorName!,
                        message: response.errorMessage!,
                    });
                }
            } else if (type === "create") {
                const response = await createHandler(data);
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
            }
        } catch (error) {
            console.error("Submission error:", error);
            setAppError({
                name: "SubmissionError",
                message: "An unexpected error occurred. Please try again.",
            });
        } finally {
            hcaptchaRef.current?.resetCaptcha();
            reset();
        }
    };

    return (
        <Card size="4" style={{ width: 366 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Flex justify="between" align="center" mb="5">
                    <Heading as="h3" size="6" mb="-2" trim="start">
                        <AnimatePresence>
                            {type === "create" && (
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
                        <div style={{ display: "inline-block", overflow: "hidden" }}>
                            Table
                        </div>
                    </Heading>
                    <ModeToggle />
                </Flex>

                {appError && (
                    <Callout.Root color="red" role="alert" mb="4" mt="-2">
                        <Callout.Icon>
                            <ExclamationTriangleIcon />
                        </Callout.Icon>
                        <Callout.Text>{appError.message}</Callout.Text>
                    </Callout.Root>
                )}

                <Input
                    isSubmitting={isSubmitting}
                    label="Table ID"
                    placeholder="Enter your table Id"
                    boxProps={{ mb: "4" }}
                    defaultMessage="Is like your username 😉"
                    error={errors.tableId}
                    register={register("tableId")}
                />
                <Input
                    isSubmitting={isSubmitting}
                    label="Password"
                    placeholder="Enter your password"
                    error={errors.password}
                    boxProps={{ mb: type === "create" ? "4" : "5" }}
                    inputProps={{ type: "password" }}
                    register={register("password")}
                />
                <AnimatePresence>
                    {type === "create" && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: errors.confirmPassword ? 96 : 78 }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Input
                                isSubmitting={isSubmitting}
                                label="Confirm Password"
                                placeholder="Enter your password again"
                                error={errors.confirmPassword}
                                register={register("confirmPassword")}
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
};

export default function LoginForm(props: {
    setTable: React.Dispatch<React.SetStateAction<Table | null>>;
    handleDataRetrieval: (data: LoginValues) => Promise<{
        status: string;
        errorName?: string;
        errorMessage?: string;
    }>;
}) {
    return (
        <Suspense fallback={<Spinner />}>
            <LoginFormContent {...props} />
        </Suspense>
    );
}