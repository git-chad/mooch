export type WaitlistActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: {
    email?: string;
  };
};

export const initialWaitlistState: WaitlistActionState = {
  status: "idle",
};
