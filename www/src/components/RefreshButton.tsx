"use client";

import { LoginValues } from "@/lib/types";
import { UpdateIcon } from "@radix-ui/react-icons";
import { Button } from "@radix-ui/themes";
import { useRef, useState } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function RefreshButton({
    handleDataRetrieval,
    data,
}: {
    handleDataRetrieval: (data: LoginValues) => Promise<{
        status: string;
        errorName?: string;
        errorMessage?: string;
    }>;
    data: LoginValues;
}) {
    const [loading, setLoading] = useState(false);
    const captchaRef = useRef<HCaptcha>(null);

    const refresh = async () => {
        setLoading(true);

        // Show hcaptcha
        captchaRef.current?.execute();
        
    };
    
    const onError = (err: any) => {
        setLoading(false);
    };

    const onVerify = async (token: string) => {
        const response = await handleDataRetrieval({
            ...data,
            hCaptchaToken: token,
        });
        if (response.status === "error") {
            alert(response.errorName + ": " + response.errorMessage);
        }
        setLoading(false);
    }

    return (
        <>
            <Button
                type="button"
                size="1"
                variant="outline"
                loading={loading}
                onClick={refresh}
            >
                Refresh <UpdateIcon width={11} height={11} />
            </Button>
            <HCaptcha
                sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
                size="invisible"
                onVerify={onVerify}
                onError={onError}
                ref={captchaRef}
            />
        </>
    );
}
