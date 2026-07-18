import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";

/* =========================================================
   DIRECCIONES DEL BACKEND
========================================================= */

const BASE_URL = "https://gestion-comercial-j3ed.onrender.com";

const API_URL = `${BASE_URL}/api`;

/* =========================================================
   INTERFACES
========================================================= */

interface FormDataProveedor {
  razon_social: string;
  nit: string;
  correo_principal: string;
  telefono_principal: string;
}

interface FormErrors {
  razon_social?: string;
  nit?: string;
  correo_principal?: string;
  telefono_principal?: string;
  productos_ids?: string;
}

interface Producto {
  producto_id: number;
  nombre_producto?: string;
  codigo_barra?: string | number | null;
  stock_total?: number | null;
  imagen_url?: string | null;
}

interface Proveedor {
  proveedor_id: number;
  razon_social: string;
  nit?: string | number | null;
  correo_principal: string;
  telefono_principal?: string | number | null;
  productos_ids?: number[];
  productos?: string[];
}

interface DatosProveedor {
  razon_social: string;
  nit: string;
  correo_principal: string;
  telefono_principal: string;
  productos_ids: number[];
}

interface ErrorBackend {
  message?: string;
  error?: string;
  detalle?: string;
}

/* =========================================================
   VALORES INICIALES
========================================================= */

const FORMULARIO_INICIAL: FormDataProveedor = {
  razon_social: "",
  nit: "",
  correo_principal: "",
  telefono_principal: "",
};

/* =========================================================
   COMPONENTE
========================================================= */

const GestionProveedores: React.FC = () => {
  const queryClient = useQueryClient();

  const [formData, setFormData] =
    useState<FormDataProveedor>(FORMULARIO_INICIAL);

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [selectedProds, setSelectedProds] = useState<number[]>([]);

  const [isEditing, setIsEditing] = useState(false);

  const [currentId, setCurrentId] = useState<number | null>(null);

  const [busquedaProducto, setBusquedaProducto] = useState("");

  const [mostrarSelectorProductos, setMostrarSelectorProductos] =
    useState(false);

  /* =====================================================
     CONSULTA DE PRODUCTOS

     Esta ruta NO lleva /api porque la ruta que tenías
     originalmente era /productos.
  ===================================================== */

  const {
    data: listaProductos = [],
    isLoading: cargandoProductos,
    isError: errorProductos,
    refetch: recargarProductos,
  } = useQuery<Producto[]>({
    queryKey: ["productos"],
    queryFn: async () => {
      const respuesta = await axios.get<Producto[]>(`${BASE_URL}/productos`);

      return Array.isArray(respuesta.data) ? respuesta.data : [];
    },
    retry: false,
  });

  /* =====================================================
     CONSULTA DE PROVEEDORES
  ===================================================== */

  const {
    data: proveedores = [],
    isLoading: cargandoProveedores,
    isError: errorProveedores,
    refetch: recargarProveedores,
  } = useQuery<Proveedor[]>({
    queryKey: ["proveedores"],
    queryFn: async () => {
      const respuesta = await axios.get<Proveedor[]>(`${API_URL}/proveedores`);

      return Array.isArray(respuesta.data) ? respuesta.data : [];
    },
    retry: false,
  });

  /* =====================================================
     VALIDACIÓN DEL CORREO
  ===================================================== */

  const validarCorreo = (correo: string): boolean => {
    const expresionCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    return expresionCorreo.test(correo);
  };

  /* =====================================================
     VALIDACIÓN COMPLETA DEL FORMULARIO
  ===================================================== */

  const validarFormulario = (): boolean => {
    const nuevosErrores: FormErrors = {};

    const razonSocial = formData.razon_social.trim();

    const nit = formData.nit.trim();

    const correo = formData.correo_principal.trim().toLowerCase();

    const telefono = formData.telefono_principal.trim();

    /* RAZÓN SOCIAL */

    if (!razonSocial) {
      nuevosErrores.razon_social = "La razón social es obligatoria.";
    } else if (razonSocial.length < 3) {
      nuevosErrores.razon_social =
        "La razón social debe tener al menos 3 caracteres.";
    } else if (razonSocial.length > 150) {
      nuevosErrores.razon_social =
        "La razón social no puede superar los 150 caracteres.";
    }

    /* NIT */

    if (!nit) {
      nuevosErrores.nit = "El NIT es obligatorio.";
    } else if (!/^\d+$/.test(nit)) {
      nuevosErrores.nit = "El NIT solamente puede contener números.";
    } else if (nit.length < 5) {
      nuevosErrores.nit = "El NIT debe tener al menos 5 números.";
    } else if (nit.length > 20) {
      nuevosErrores.nit = "El NIT no puede superar los 20 números.";
    }

    /* CORREO */

    if (!correo) {
      nuevosErrores.correo_principal = "El correo principal es obligatorio.";
    } else if (!validarCorreo(correo)) {
      nuevosErrores.correo_principal =
        "Ingresa un correo válido. Ejemplo: proveedor@gmail.com.";
    } else if (correo.length > 150) {
      nuevosErrores.correo_principal =
        "El correo no puede superar los 150 caracteres.";
    }

    /* TELÉFONO */

    if (!telefono) {
      nuevosErrores.telefono_principal =
        "El teléfono principal es obligatorio.";
    } else if (!/^\d+$/.test(telefono)) {
      nuevosErrores.telefono_principal =
        "El teléfono solamente puede contener números.";
    } else if (telefono.length < 7) {
      nuevosErrores.telefono_principal =
        "El teléfono debe tener al menos 7 números.";
    } else if (telefono.length > 15) {
      nuevosErrores.telefono_principal =
        "El teléfono no puede superar los 15 números.";
    }

    setFormErrors(nuevosErrores);

    const formularioValido = Object.keys(nuevosErrores).length === 0;

    if (!formularioValido) {
      const primerError = Object.values(nuevosErrores)[0];

      toast.error(primerError || "Revisa los campos del formulario.");
    }

    return formularioValido;
  };

  /* =====================================================
     MUTACIÓN PARA GUARDAR O ACTUALIZAR
  ===================================================== */

  const mutation = useMutation({
    mutationFn: async (datos: DatosProveedor) => {
      if (isEditing) {
        if (currentId === null) {
          throw new Error("No se encontró el proveedor que se desea editar.");
        }

        return axios.put(`${API_URL}/proveedores/${currentId}`, datos);
      }

      return axios.post(`${API_URL}/proveedores`, datos);
    },

    onSuccess: () => {
      toast.success(
        isEditing
          ? "Proveedor actualizado correctamente."
          : "Proveedor registrado correctamente.",
      );

      cancelarEdicion();

      queryClient.invalidateQueries({
        queryKey: ["proveedores"],
      });
    },

    onError: (error: AxiosError<ErrorBackend> | Error) => {
      console.error("Error completo al guardar:", error);

      if (axios.isAxiosError(error)) {
        const estado = error.response?.status;

        const respuestaBackend = error.response?.data;

        const mensajeBackend =
          respuestaBackend?.message ||
          respuestaBackend?.error ||
          respuestaBackend?.detalle;

        console.error("Estado HTTP:", estado);

        console.error("Respuesta del backend:", respuestaBackend);

        if (estado === 409) {
          toast.error(
            mensajeBackend || "Ya existe un proveedor con ese NIT o correo.",
          );

          return;
        }

        if (estado === 400) {
          toast.error(mensajeBackend || "Los datos enviados no son válidos.");

          return;
        }

        if (estado === 404) {
          toast.error(mensajeBackend || "No se encontró la ruta del servidor.");

          return;
        }

        if (estado === 500) {
          toast.error(
            mensajeBackend ||
              "El servidor tuvo un error al guardar el proveedor.",
          );

          return;
        }

        if (!error.response) {
          toast.error(
            "No se pudo conectar con el servidor. Verifica tu conexión o el estado de Render.",
          );

          return;
        }

        toast.error(mensajeBackend || "No se pudo guardar el proveedor.");

        return;
      }

      toast.error(error.message || "Ocurrió un error inesperado.");
    },
  });

  /* =====================================================
     LIMPIAR ERROR DE UN CAMPO
  ===================================================== */

  const limpiarErrorCampo = (campo: keyof FormErrors) => {
    setFormErrors((prev) => {
      if (!prev[campo]) {
        return prev;
      }

      const nuevosErrores = {
        ...prev,
      };

      delete nuevosErrores[campo];

      return nuevosErrores;
    });
  };

  /* =====================================================
     CAMBIO DE CAMPOS
  ===================================================== */

  const handleInputChange = (campo: keyof FormDataProveedor, valor: string) => {
    let nuevoValor = valor;

    /*
      NIT y teléfono:
      elimina cualquier carácter que no sea número.
    */

    if (campo === "nit" || campo === "telefono_principal") {
      nuevoValor = valor.replace(/\D/g, "");
    }

    /*
      Correo:
      elimina espacios y lo convierte a minúsculas.
    */

    if (campo === "correo_principal") {
      nuevoValor = valor.replace(/\s/g, "").toLowerCase();
    }

    setFormData((prev) => ({
      ...prev,
      [campo]: nuevoValor,
    }));

    limpiarErrorCampo(campo);
  };

  /* =====================================================
     VALIDACIONES INDIVIDUALES AL SALIR DEL CAMPO
  ===================================================== */

  const validarCampo = (campo: keyof FormDataProveedor) => {
    const valor = formData[campo].trim();

    if (campo === "razon_social") {
      if (!valor) {
        setFormErrors((prev) => ({
          ...prev,
          razon_social: "La razón social es obligatoria.",
        }));
      } else if (valor.length < 3) {
        setFormErrors((prev) => ({
          ...prev,
          razon_social: "La razón social debe tener al menos 3 caracteres.",
        }));
      }
    }

    if (campo === "nit") {
      if (!valor) {
        setFormErrors((prev) => ({
          ...prev,
          nit: "El NIT es obligatorio.",
        }));
      } else if (valor.length < 5) {
        setFormErrors((prev) => ({
          ...prev,
          nit: "El NIT debe tener al menos 5 números.",
        }));
      }
    }

    if (campo === "correo_principal") {
      if (!valor) {
        setFormErrors((prev) => ({
          ...prev,
          correo_principal: "El correo principal es obligatorio.",
        }));
      } else if (!validarCorreo(valor)) {
        setFormErrors((prev) => ({
          ...prev,
          correo_principal:
            "Ingresa un correo válido. Ejemplo: proveedor@gmail.com.",
        }));
      }
    }

    if (campo === "telefono_principal") {
      if (!valor) {
        setFormErrors((prev) => ({
          ...prev,
          telefono_principal: "El teléfono principal es obligatorio.",
        }));
      } else if (valor.length < 7) {
        setFormErrors((prev) => ({
          ...prev,
          telefono_principal: "El teléfono debe tener al menos 7 números.",
        }));
      }
    }
  };

  /* =====================================================
     ENVIAR FORMULARIO
  ===================================================== */

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    const datosProveedor: DatosProveedor = {
      razon_social: formData.razon_social.trim(),

      nit: formData.nit.trim(),

      correo_principal: formData.correo_principal.trim().toLowerCase(),

      telefono_principal: formData.telefono_principal.trim(),

      productos_ids: selectedProds,
    };

    console.log("Datos enviados al backend:", datosProveedor);

    mutation.mutate(datosProveedor);
  };

  /* =====================================================
     SELECCIONAR O QUITAR PRODUCTO
  ===================================================== */

  const toggleProducto = (productoId: number) => {
    setSelectedProds((prev) => {
      if (prev.includes(productoId)) {
        return prev.filter((id) => id !== productoId);
      }

      return [...prev, productoId];
    });
  };

  /* =====================================================
     FILTRAR PRODUCTOS
  ===================================================== */

  const productosFiltrados = useMemo(() => {
    const termino = busquedaProducto.trim().toLowerCase();

    if (!termino) {
      return listaProductos;
    }

    return listaProductos.filter((producto) => {
      const nombre = String(producto.nombre_producto || "").toLowerCase();

      const codigo = String(producto.codigo_barra || "").toLowerCase();

      return nombre.includes(termino) || codigo.includes(termino);
    });
  }, [listaProductos, busquedaProducto]);

  /* =====================================================
     PREPARAR EDICIÓN
  ===================================================== */

  const prepararEdicion = (proveedor: Proveedor) => {
    setIsEditing(true);

    setCurrentId(proveedor.proveedor_id);

    setFormData({
      razon_social: proveedor.razon_social || "",

      nit:
        proveedor.nit !== null && proveedor.nit !== undefined
          ? String(proveedor.nit)
          : "",

      correo_principal: proveedor.correo_principal || "",

      telefono_principal:
        proveedor.telefono_principal !== null &&
        proveedor.telefono_principal !== undefined
          ? String(proveedor.telefono_principal)
          : "",
    });

    setSelectedProds(
      Array.isArray(proveedor.productos_ids)
        ? proveedor.productos_ids.map(Number)
        : [],
    );

    setFormErrors({});
    setBusquedaProducto("");
    setMostrarSelectorProductos(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =====================================================
     CANCELAR EDICIÓN Y LIMPIAR FORMULARIO
  ===================================================== */

  const cancelarEdicion = () => {
    setIsEditing(false);
    setCurrentId(null);

    setFormData(FORMULARIO_INICIAL);

    setFormErrors({});
    setSelectedProds([]);
    setBusquedaProducto("");

    setMostrarSelectorProductos(false);
  };

  /* =====================================================
     ESTILOS
  ===================================================== */

  const estiloInput = (tieneError: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "12px",
    borderRadius: "8px",

    border: tieneError ? "1px solid #ef4444" : "1px solid #e2e8f0",

    outline: "none",
    boxSizing: "border-box",

    backgroundColor: tieneError ? "#fef2f2" : "#ffffff",

    color: "#1e293b",
  });

  const estiloLabel: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748b",
  };

  const estiloContenedorCampo: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  };

  const estiloError: React.CSSProperties = {
    color: "#dc2626",
    fontSize: "12px",
    fontWeight: "500",
  };

  /* =====================================================
     ESTADO DE CARGA DE PROVEEDORES
  ===================================================== */

  if (cargandoProveedores) {
    return (
      <div
        style={{
          padding: "30px",
          textAlign: "center",
          color: "#475569",
        }}
      >
        Cargando proveedores...
      </div>
    );
  }

  /* =====================================================
     ERROR AL CARGAR PROVEEDORES
  ===================================================== */

  if (errorProveedores) {
    return (
      <div
        style={{
          padding: "20px",
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "12px",
          color: "#b91c1c",
        }}
      >
        <strong>No se pudo cargar la lista de proveedores.</strong>

        <p>
          Verifica que la ruta <strong>/api/proveedores</strong> esté
          disponible.
        </p>

        <button
          type="button"
          onClick={() => recargarProveedores()}
          style={{
            padding: "9px 14px",
            backgroundColor: "#dc2626",
            color: "#ffffff",
            border: "none",
            borderRadius: "7px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Intentar nuevamente
        </button>
      </div>
    );
  }

  /* =====================================================
     INTERFAZ
  ===================================================== */

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* =================================================
          FORMULARIO
      ================================================= */}

      <div
        style={{
          backgroundColor: "white",
          padding: "25px",
          borderRadius: "16px",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          borderLeft: "6px solid #2563eb",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            color: "#1e293b",
            marginBottom: "6px",
          }}
        >
          {isEditing ? "✏️ Editar proveedor" : "➕ Registrar proveedor"}
        </h3>

        <p
          style={{
            marginTop: 0,
            marginBottom: "20px",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          Los campos marcados con * son obligatorios.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "15px",
          }}
        >
          {/* RAZÓN SOCIAL */}

          <div style={estiloContenedorCampo}>
            <label htmlFor="razon_social" style={estiloLabel}>
              Razón social *
            </label>

            <input
              id="razon_social"
              name="razon_social"
              type="text"
              value={formData.razon_social}
              onChange={(event) =>
                handleInputChange("razon_social", event.target.value)
              }
              onBlur={() => validarCampo("razon_social")}
              minLength={3}
              maxLength={150}
              placeholder="Ej.: Distribuidora Sanidad y Vida"
              autoComplete="organization"
              aria-invalid={Boolean(formErrors.razon_social)}
              style={estiloInput(Boolean(formErrors.razon_social))}
            />

            {formErrors.razon_social && (
              <span style={estiloError}>⚠️ {formErrors.razon_social}</span>
            )}
          </div>

          {/* NIT */}

          <div style={estiloContenedorCampo}>
            <label htmlFor="nit" style={estiloLabel}>
              NIT *
            </label>

            <input
              id="nit"
              name="nit"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.nit}
              onChange={(event) => handleInputChange("nit", event.target.value)}
              onBlur={() => validarCampo("nit")}
              minLength={5}
              maxLength={20}
              placeholder="Ej.: 123456789"
              autoComplete="off"
              aria-invalid={Boolean(formErrors.nit)}
              style={estiloInput(Boolean(formErrors.nit))}
            />

            {formErrors.nit && (
              <span style={estiloError}>⚠️ {formErrors.nit}</span>
            )}
          </div>

          {/* CORREO */}

          <div style={estiloContenedorCampo}>
            <label htmlFor="correo_principal" style={estiloLabel}>
              Correo principal *
            </label>

            <input
              id="correo_principal"
              name="correo_principal"
              type="email"
              value={formData.correo_principal}
              onChange={(event) =>
                handleInputChange("correo_principal", event.target.value)
              }
              onBlur={() => validarCampo("correo_principal")}
              maxLength={150}
              placeholder="Ej.: proveedor@gmail.com"
              autoComplete="email"
              aria-invalid={Boolean(formErrors.correo_principal)}
              style={estiloInput(Boolean(formErrors.correo_principal))}
            />

            {formErrors.correo_principal && (
              <span style={estiloError}>⚠️ {formErrors.correo_principal}</span>
            )}
          </div>

          {/* TELÉFONO */}

          <div style={estiloContenedorCampo}>
            <label htmlFor="telefono_principal" style={estiloLabel}>
              Teléfono principal *
            </label>

            <input
              id="telefono_principal"
              name="telefono_principal"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.telefono_principal}
              onChange={(event) =>
                handleInputChange("telefono_principal", event.target.value)
              }
              onBlur={() => validarCampo("telefono_principal")}
              minLength={7}
              maxLength={15}
              placeholder="Ej.: 64072026"
              autoComplete="tel"
              aria-invalid={Boolean(formErrors.telefono_principal)}
              style={estiloInput(Boolean(formErrors.telefono_principal))}
            />

            {formErrors.telefono_principal && (
              <span style={estiloError}>
                ⚠️ {formErrors.telefono_principal}
              </span>
            )}
          </div>

          {/* PRODUCTOS RELACIONADOS */}

          <div
            style={{
              gridColumn: "1/-1",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "8px",
              }}
            >
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#64748b",
                }}
              >
                Productos relacionados
              </label>

              <span
                style={{
                  fontSize: "12px",
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  padding: "4px 9px",
                  borderRadius: "999px",
                  fontWeight: "bold",
                }}
              >
                {selectedProds.length} seleccionados
              </span>
            </div>

            <input
              type="text"
              value={busquedaProducto}
              disabled={cargandoProductos || errorProductos}
              onClick={() => setMostrarSelectorProductos(true)}
              onFocus={() => setMostrarSelectorProductos(true)}
              onChange={(event) => {
                setBusquedaProducto(event.target.value);

                setMostrarSelectorProductos(true);
              }}
              placeholder={
                cargandoProductos
                  ? "Cargando productos..."
                  : errorProductos
                    ? "No se pudieron cargar los productos"
                    : "🔍 Presiona aquí para buscar y agregar productos..."
              }
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                outline: "none",
                fontSize: "13px",
                boxSizing: "border-box",
                marginBottom: mostrarSelectorProductos ? "8px" : "0",
                backgroundColor:
                  cargandoProductos || errorProductos ? "#f1f5f9" : "#ffffff",
              }}
            />

            {errorProductos && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "10px",
                  borderRadius: "8px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                }}
              >
                <span
                  style={{
                    display: "block",
                    color: "#dc2626",
                    fontSize: "12px",
                    marginBottom: "8px",
                  }}
                >
                  ⚠️ No se pudieron cargar los productos desde{" "}
                  <strong>/productos</strong>.
                </span>

                <button
                  type="button"
                  onClick={() => recargarProductos()}
                  style={{
                    border: "none",
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  Intentar nuevamente
                </button>
              </div>
            )}

            {mostrarSelectorProductos &&
              !errorProductos &&
              !cargandoProductos && (
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    overflow: "hidden",
                    maxHeight: "220px",
                    overflowY: "auto",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 10px",
                      backgroundColor: "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        fontWeight: "600",
                      }}
                    >
                      Selecciona los productos
                    </span>

                    <button
                      type="button"
                      onClick={() => setMostrarSelectorProductos(false)}
                      style={{
                        border: "none",
                        backgroundColor: "#fee2e2",
                        color: "#ef4444",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      Cerrar
                    </button>
                  </div>

                  {productosFiltrados.length > 0 ? (
                    productosFiltrados.map((producto) => {
                      const seleccionado = selectedProds.includes(
                        producto.producto_id,
                      );

                      return (
                        <div
                          key={producto.producto_id}
                          onClick={() => toggleProducto(producto.producto_id)}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "34px 1fr auto",
                            gap: "10px",
                            alignItems: "center",
                            padding: "8px 10px",
                            borderBottom: "1px solid #f1f5f9",
                            cursor: "pointer",
                            backgroundColor: seleccionado
                              ? "#eff6ff"
                              : "#ffffff",
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "7px",
                              backgroundColor: "#e2e8f0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                            }}
                          >
                            {producto.imagen_url &&
                            !producto.imagen_url.includes(
                              "via.placeholder.com",
                            ) ? (
                              <img
                                src={producto.imagen_url}
                                alt={producto.nombre_producto || "Producto"}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <span
                                style={{
                                  fontSize: "16px",
                                }}
                              >
                                📦
                              </span>
                            )}
                          </div>

                          <div>
                            <div
                              style={{
                                fontWeight: "700",
                                color: "#1e293b",
                                fontSize: "13px",
                              }}
                            >
                              {producto.nombre_producto ||
                                "Producto sin nombre"}
                            </div>

                            <div
                              style={{
                                fontSize: "11px",
                                color: "#64748b",
                                marginTop: "2px",
                              }}
                            >
                              Código: {producto.codigo_barra || "Sin código"}
                              {" · "}
                              Stock: {producto.stock_total ?? 0}
                            </div>
                          </div>

                          <input
                            type="checkbox"
                            checked={seleccionado}
                            onChange={() =>
                              toggleProducto(producto.producto_id)
                            }
                            onClick={(event) => event.stopPropagation()}
                            style={{
                              width: "16px",
                              height: "16px",
                              cursor: "pointer",
                            }}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <div
                      style={{
                        padding: "15px",
                        textAlign: "center",
                        color: "#64748b",
                        fontSize: "13px",
                      }}
                    >
                      No se encontraron productos.
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* BOTÓN GUARDAR */}

          <button
            type="submit"
            disabled={mutation.isPending}
            style={{
              gridColumn: "1/-1",
              padding: "12px",

              backgroundColor: mutation.isPending ? "#94a3b8" : "#2563eb",

              color: "white",
              border: "none",
              borderRadius: "8px",

              cursor: mutation.isPending ? "not-allowed" : "pointer",

              fontWeight: "bold",
            }}
          >
            {mutation.isPending
              ? "Guardando..."
              : isEditing
                ? "Actualizar proveedor"
                : "Guardar proveedor"}
          </button>

          {isEditing && (
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={cancelarEdicion}
              style={{
                gridColumn: "1/-1",
                padding: "10px",
                backgroundColor: "#94a3b8",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: mutation.isPending ? "not-allowed" : "pointer",
              }}
            >
              Cancelar edición
            </button>
          )}
        </form>
      </div>

      {/* =================================================
          TABLA DE PROVEEDORES
      ================================================= */}

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "16px",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "800px",
          }}
        >
          <thead>
            <tr
              style={{
                textAlign: "left",
                backgroundColor: "#f8fafc",
                borderBottom: "2px solid #e2e8f0",
              }}
            >
              {[
                "Razón social",
                "NIT",
                "Correo",
                "Teléfono",
                "Productos",
                "Acciones",
              ].map((encabezado) => (
                <th
                  key={encabezado}
                  style={{
                    padding: "15px",
                    color: "#475569",
                    fontSize: "0.85rem",
                  }}
                >
                  {encabezado}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {proveedores.length > 0 ? (
              proveedores.map((proveedor) => {
                return (
                  <tr
                    key={proveedor.proveedor_id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <td
                      style={{
                        padding: "15px",
                        fontWeight: "600",
                      }}
                    >
                      {proveedor.razon_social}
                    </td>

                    <td
                      style={{
                        padding: "15px",
                      }}
                    >
                      {proveedor.nit || "Sin NIT"}
                    </td>

                    <td
                      style={{
                        padding: "15px",
                        color: "#2563eb",
                      }}
                    >
                      {proveedor.correo_principal}
                    </td>

                    <td
                      style={{
                        padding: "15px",
                      }}
                    >
                      {proveedor.telefono_principal || "Sin teléfono"}
                    </td>

                    <td
                      style={{
                        padding: "15px",
                      }}
                    >
                      {Array.isArray(proveedor.productos) &&
                      proveedor.productos.length > 0 ? (
                        proveedor.productos.map((nombre, index) => (
                          <span
                            key={`${nombre}-${index}`}
                            style={{
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              backgroundColor: "#e0f2fe",
                              color: "#0369a1",
                              margin: "2px",
                              display: "inline-block",
                            }}
                          >
                            {nombre}
                          </span>
                        ))
                      ) : (
                        <span
                          style={{
                            color: "#94a3b8",
                            fontSize: "12px",
                          }}
                        >
                          Sin productos relacionados
                        </span>
                      )}
                    </td>

                    <td
                      style={{
                        padding: "15px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => prepararEdicion(proveedor)}
                        style={{
                          backgroundColor: "#f59e0b",
                          color: "white",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        ✏️ Editar
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "30px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Todavía no existen proveedores registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionProveedores;