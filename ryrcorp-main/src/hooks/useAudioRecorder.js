import { useCallback, useEffect, useRef, useState } from "react";

const MIME_TYPES = [
  "audio/ogg;codecs=opus",
  "audio/webm;codecs=opus",
  "audio/mp4",
];

function obtenerMimeCompatible() {
  if (typeof MediaRecorder === "undefined") return "";

  return MIME_TYPES.find((mime) => MediaRecorder.isTypeSupported(mime)) || "";
}

function obtenerExtension(mime = "") {
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4")) return "m4a";
  return "webm";
}

function mensajeErrorMicrofono(error) {
  if (error?.name === "NotAllowedError") {
    return "Debes permitir el acceso al micrófono.";
  }

  if (error?.name === "NotFoundError") {
    return "No se encontró ningún micrófono.";
  }

  if (error?.name === "NotReadableError") {
    return "El micrófono está siendo utilizado por otra aplicación.";
  }

  return error?.message || "No se pudo iniciar la grabación.";
}

export function useAudioRecorder() {
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const secondsRef = useRef(0);

  const [status, setStatus] = useState("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");

  const limpiarRecursos = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());

    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (
      typeof MediaRecorder === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      const message =
        "Este navegador no permite grabar audio desde el micrófono.";

      setError(message);
      throw new Error(message);
    }

    if (
      recorderRef.current?.state !== undefined &&
      recorderRef.current.state !== "inactive"
    ) {
      return;
    }

    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];
      secondsRef.current = 0;
      setSeconds(0);

      const mimeType = obtenerMimeCompatible();

      const recorder = mimeType
        ? new MediaRecorder(stream, {
            mimeType,
            audioBitsPerSecond: 48000,
          })
        : new MediaRecorder(stream, {
            audioBitsPerSecond: 48000,
          });

      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        setError(
          mensajeErrorMicrofono(event.error || new Error("Error de grabación")),
        );

        limpiarRecursos();
        setStatus("idle");
      };

      recorder.start(250);
      setStatus("recording");

      timerRef.current = setInterval(() => {
        if (recorderRef.current?.state !== "recording") return;

        secondsRef.current += 1;
        setSeconds(secondsRef.current);
      }, 1000);
    } catch (recordingError) {
      limpiarRecursos();

      const message = mensajeErrorMicrofono(recordingError);

      setError(message);
      setStatus("idle");

      throw new Error(message);
    }
  }, [limpiarRecursos]);

  const stop = useCallback(
    (discard = false) =>
      new Promise((resolve, reject) => {
        const recorder = recorderRef.current;

        if (!recorder || recorder.state === "inactive") {
          limpiarRecursos();
          setStatus("idle");
          resolve(null);
          return;
        }

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        setStatus("processing");

        recorder.addEventListener(
          "stop",
          () => {
            try {
              const mimeType =
                recorder.mimeType || chunksRef.current[0]?.type || "audio/webm";

              const blob = new Blob(chunksRef.current, {
                type: mimeType,
              });

              const duration = secondsRef.current;

              limpiarRecursos();
              setStatus("idle");

              if (discard || !blob.size) {
                resolve(null);
                return;
              }

              const extension = obtenerExtension(mimeType);

              const file = new File(
                [blob],
                `nota-voz-${Date.now()}.${extension}`,
                {
                  type: mimeType,
                  lastModified: Date.now(),
                },
              );

              resolve({
                file,
                duration,
                mimeType,
              });
            } catch (stopError) {
              limpiarRecursos();
              setStatus("idle");
              reject(stopError);
            }
          },
          { once: true },
        );

        recorder.stop();
      }),
    [limpiarRecursos],
  );

  const finish = useCallback(() => stop(false), [stop]);
  const cancel = useCallback(() => stop(true), [stop]);

  const togglePause = useCallback(() => {
    const recorder = recorderRef.current;

    if (!recorder) return;

    if (recorder.state === "recording") {
      recorder.pause();
      setStatus("paused");
      return;
    }

    if (recorder.state === "paused") {
      recorder.resume();
      setStatus("recording");
    }
  }, []);

  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;

      if (recorder && recorder.state !== "inactive") {
        recorder.ondataavailable = null;
        recorder.stop();
      }

      limpiarRecursos();
    };
  }, [limpiarRecursos]);

  return {
    status,
    seconds,
    error,
    start,
    finish,
    cancel,
    togglePause,
    isActive: ["recording", "paused", "processing"].includes(status),
  };
}
