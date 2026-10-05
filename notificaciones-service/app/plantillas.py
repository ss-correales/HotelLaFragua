def _plantilla_base(titulo: str, cuerpo_html: str) -> str:
    return f"""
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 480px; margin: 0 auto; background: #f7f3ef; padding: 32px 24px;">
      <h1 style="color: #6b3f2b; font-size: 22px; margin: 0 0 16px;">{titulo}</h1>
      {cuerpo_html}
      <p style="color: #9a8f84; font-size: 12px; margin-top: 32px;">Hotel La Fragua</p>
    </div>
    """


def correo_bienvenida(nombre: str | None) -> tuple[str, str]:
    asunto = "¡Bienvenido a Hotel La Fragua!"
    cuerpo = f"""
      <p style="color:#3a2e26;font-size:15px;line-height:1.5;">Hola {nombre or ''},</p>
      <p style="color:#3a2e26;font-size:15px;line-height:1.5;">
        Tu cuenta en Hotel La Fragua ya está activa. Ya puedes buscar disponibilidad
        y reservar tu próxima estadía.
      </p>
    """
    return asunto, _plantilla_base("¡Bienvenido!", cuerpo)


def correo_confirmacion_reserva(
    nombre: str | None, tipo_habitacion: str, fecha_inicio: str, fecha_fin: str, total: float
) -> tuple[str, str]:
    asunto = "Confirmación de tu reserva — Hotel La Fragua"
    cuerpo = f"""
      <p style="color:#3a2e26;font-size:15px;line-height:1.5;">Hola {nombre or ''},</p>
      <p style="color:#3a2e26;font-size:15px;line-height:1.5;">Tu reserva fue creada exitosamente:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:6px 0;color:#6b5d53;">Habitación</td><td style="padding:6px 0;color:#3a2e26;font-weight:600;">{tipo_habitacion}</td></tr>
        <tr><td style="padding:6px 0;color:#6b5d53;">Entrada</td><td style="padding:6px 0;color:#3a2e26;font-weight:600;">{fecha_inicio}</td></tr>
        <tr><td style="padding:6px 0;color:#6b5d53;">Salida</td><td style="padding:6px 0;color:#3a2e26;font-weight:600;">{fecha_fin}</td></tr>
        <tr><td style="padding:6px 0;color:#6b5d53;">Total</td><td style="padding:6px 0;color:#3a2e26;font-weight:600;">${total:,.0f}</td></tr>
      </table>
      <p style="color:#3a2e26;font-size:15px;line-height:1.5;">Te esperamos pronto.</p>
    """
    return asunto, _plantilla_base("Reserva confirmada", cuerpo)
