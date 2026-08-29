"use client";

import { useState, useTransition } from "react";
import { ArrowRight, LoaderCircle, Mail } from "lucide-react";
import { requestMagicLink } from "@/src/modules/auth/actions";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string>();
  const [isPending, startTransition] = useTransition();

  return (
    <form className="auth-form" onSubmit={(event) => {
      event.preventDefault();
      startTransition(async () => {
        const result = await requestMagicLink(email);
        setMessage(result.message);
      });
    }}>
      <label htmlFor="email">Adres e-mail</label>
      <div className="input-with-icon"><Mail aria-hidden="true" size={18} /><input id="email" type="email" autoComplete="email" placeholder="ty@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
      <button className="primary-action wide" disabled={isPending} type="submit">{isPending ? <LoaderCircle className="spin" aria-hidden="true" size={18} /> : <ArrowRight aria-hidden="true" size={18} />} Wyślij link logowania</button>
      {message && <p className="form-message" role="status">{message}</p>}
    </form>
  );
}