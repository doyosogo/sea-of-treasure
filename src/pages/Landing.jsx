import { useState } from "react";
import { LOGO } from "../data/assets.js";
import { useAuth } from "../context/AuthContext.jsx";

const initialLogin = {
  identifier: "",
  password: ""
};

const initialRegister = {
  username: "",
  email: "",
  password: ""
};

function Landing({ onPlayOffline }) {
  const { login, register } = useAuth();
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(null);

  async function handleLogin(event) {
    event.preventDefault();
    setSubmitting("login");
    setStatus(null);

    try {
      await login(loginForm);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setSubmitting("register");
    setStatus(null);

    try {
      await register(registerForm);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <section
      className="landing-page"
      style={{
        backgroundImage: "linear-gradient(rgba(5, 8, 14, 0.2), rgba(5, 8, 14, 0.68)), url('/assets/scenes/login_wallpaper.png'), url('/assets/scenes/login_walppaper.png')"
      }}
    >
      <div className="landing-vignette" aria-hidden="true" />

      <form className="landing-login-panel" onSubmit={handleLogin}>
        <div className="landing-panel-title">
          <span>Captain Login</span>
        </div>
        <label>
          <span>Email or Username</span>
          <input
            autoComplete="username"
            onChange={(event) => setLoginForm((form) => ({ ...form, identifier: event.target.value }))}
            required
            type="text"
            value={loginForm.identifier}
          />
        </label>
        <label>
          <span>Password</span>
          <input
            autoComplete="current-password"
            onChange={(event) => setLoginForm((form) => ({ ...form, password: event.target.value }))}
            required
            type="password"
            value={loginForm.password}
          />
        </label>
          <button className={submitting === "login" ? "landing-button loading" : "landing-button"} disabled={submitting !== null} type="submit">
            {submitting === "login" ? <LoadingLabel label="Logging in" /> : "Login"}
          </button>
      </form>

      <div className="landing-center">
        <div className="landing-brand-mark">
          <img alt="Sea of Treasure logo" src={LOGO} />
        </div>
        <form className="landing-register-panel" onSubmit={handleRegister}>
          <div className="landing-register-heading">
            <p>Sea of Treasure</p>
            <h1>Begin Your Voyage</h1>
          </div>

          {status ? (
            <div className={`landing-status ${status.type}`} role="status">
              {status.message}
            </div>
          ) : null}

          <label>
            <span>Username</span>
            <input
              autoComplete="username"
              minLength={3}
              onChange={(event) => setRegisterForm((form) => ({ ...form, username: event.target.value }))}
              required
              type="text"
              value={registerForm.username}
            />
          </label>
          <label>
            <span>Email</span>
            <input
              autoComplete="email"
              onChange={(event) => setRegisterForm((form) => ({ ...form, email: event.target.value }))}
              required
              type="email"
              value={registerForm.email}
            />
          </label>
          <label>
            <span>Password</span>
            <input
              autoComplete="new-password"
              minLength={8}
              onChange={(event) => setRegisterForm((form) => ({ ...form, password: event.target.value }))}
              required
              type="password"
              value={registerForm.password}
            />
          </label>
          <button className={submitting === "register" ? "landing-button large loading" : "landing-button large"} disabled={submitting !== null} type="submit">
            {submitting === "register" ? <LoadingLabel label="Registering" /> : "Register"}
          </button>
          <button className={submitting !== null ? "landing-offline-button loading" : "landing-offline-button"} disabled={submitting !== null} onClick={onPlayOffline} type="button">
            Play Offline
          </button>
        </form>
      </div>
    </section>
  );
}

function LoadingLabel({ label }) {
  return (
    <span className="button-loading">
      <span className="button-spinner" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

Landing.backgroundMusic = "menu";

export default Landing;
