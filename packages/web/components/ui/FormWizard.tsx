import { type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "./Button";
import type { LucideIcon } from "lucide-react";

interface Step {
    label: string;
    icon?: LucideIcon;
}

interface FormWizardProps {
    steps: Step[];
    currentStep: number;
    onNext: () => void;
    onBack: () => void;
    children: ReactNode;
    isLastStep?: boolean;
    nextDisabled?: boolean;
    nextLabel?: string;
    submitting?: boolean;
}

export function FormWizard({
    steps,
    currentStep,
    onNext,
    onBack,
    children,
    isLastStep = false,
    nextDisabled = false,
    nextLabel,
    submitting = false,
}: FormWizardProps) {
    const { t } = useTranslation();

    return (
        <div className="space-y-8">
            {/* Step indicator */}
            <nav aria-label="Progress" className="w-full">
                <ol className="flex items-center justify-between">
                    {steps.map((step, index) => {
                        const isCompleted = index < currentStep;
                        const isCurrent = index === currentStep;
                        const StepIcon = step.icon;

                        return (
                            <li
                                key={step.label}
                                className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    {/* Circle */}
                                    <div
                                        className={`
                                            flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-bold transition-all duration-300
                                            ${isCompleted
                                                ? "bg-primary border-primary text-white"
                                                : isCurrent
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-foreground/20 bg-surface text-foreground/40"
                                            }
                                        `}
                                    >
                                        {isCompleted ? (
                                            <Check size={18} strokeWidth={3} />
                                        ) : StepIcon ? (
                                            <span className="md:hidden"><StepIcon size={18} /></span>
                                        ) : null}
                                        {isCompleted ? null : (
                                            <span className={StepIcon ? "hidden md:inline" : ""}>{index + 1}</span>
                                        )}
                                    </div>
                                    {/* Label — hidden on mobile, visible on md+ */}
                                    <span
                                        className={`
                                            hidden md:block text-xs font-medium text-center max-w-[100px] leading-tight
                                            ${isCurrent ? "text-primary" : isCompleted ? "text-foreground/70" : "text-foreground/40"}
                                        `}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                                {/* Connector line */}
                                {index < steps.length - 1 && (
                                    <div className="flex-1 mx-3 h-0.5 self-start mt-5">
                                        <div
                                            className={`h-full rounded-full transition-colors duration-300 ${
                                                index < currentStep ? "bg-primary" : "bg-foreground/10"
                                            }`}
                                        />
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>

            {/* Step content with animation */}
            <div className="min-h-[300px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between pt-4 border-t border-foreground/6">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onBack}
                    disabled={currentStep === 0}
                    className={currentStep === 0 ? "invisible" : ""}
                >
                    <ChevronLeft size={18} className="mr-1 inline" />
                    {t("wizard.back")}
                </Button>

                {isLastStep ? null : (
                    <Button
                        type="button"
                        onClick={onNext}
                        disabled={nextDisabled || submitting}
                    >
                        {nextLabel || t("wizard.next")}
                        <ChevronRight size={18} className="ml-1 inline" />
                    </Button>
                )}
            </div>
        </div>
    );
}
