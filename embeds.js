```js id="9q0t3p"
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");


const STATUS_COLOR = {

  Ausstehend:
    0xc98a4b,

  Bestätigt:
    0x3f8f5f,

  Abgelehnt:
    0xb23a2b,

  Abgeschlossen:
    0x5865f2,
};


// =====================================================
// BESTELL-EMBED
// =====================================================

function buildOrderEmbed(
  order
) {

  const angemeldeteMenge =
    order.angemeldeteMenge || 0;


  const restlicheMenge =
    Math.max(
      0,
      order.menge -
        angemeldeteMenge
    );


  const anmeldungText =
    `${angemeldeteMenge} / ${order.menge} Stück\n` +
    `Noch offen: ${restlicheMenge} Stück`;


  return new EmbedBuilder()

    .setTitle(
      "Ausrüstungsbestellung · " +
      order.id
    )

    .setColor(
      STATUS_COLOR[
        order.status
      ] ??
      STATUS_COLOR.Ausstehend
    )

    .addFields(

      {
        name:
          "Artikel",

        value:
          order.artikel ||
          "—",

        inline:
          true,
      },

      {
        name:
          "Menge",

        value:
          String(
            order.menge ??
            "—"
          ),

        inline:
          true,
      },

      {
        name:
          "Zugewiesen an",

        value:
          order.zugewiesenAn ||
          "—",

        inline:
          true,
      },

      {
        name:
          "Angefordert von",

        value:
          order.angefordertVon ||
          "—",

        inline:
          true,
      },

      {
        name:
          "Abteilung / Grund",

        value:
          order.abteilungGrund ||
          "—",

        inline:
          false,
      },

      {
        name:
          "Herstellungsanmeldungen",

        value:
          anmeldungText,

        inline:
          false,
      },

      {
        name:
          "Status",

        value:
          order.status,

        inline:
          true,
      }
    )

    .setFooter({

      text:
        "Erstellt am " +
        new Date(
          order.erstelltAm
        ).toLocaleString(
          "de-DE"
        ),
    });
}


// =====================================================
// BUTTONS
// =====================================================

function buildOrderButtons(
  order
) {

  const isOpen =
    order.status ===
    "Ausstehend";

  const isConfirmed =
    order.status ===
    "Bestätigt";

  const isFinished =
    order.status ===
      "Abgeschlossen" ||
    order.status ===
      "Abgelehnt";


  const angemeldeteMenge =
    order.angemeldeteMenge || 0;


  // ---------------------------------------------------
  // ANMELDEN
  // ---------------------------------------------------

  const signup =
    new ButtonBuilder()

      .setCustomId(
        "order_signup_" +
        order.id
      )

      .setLabel(
        "Anmelden"
      )

      .setStyle(
        ButtonStyle.Primary
      )

      .setDisabled(
        !isOpen ||
        angemeldeteMenge >=
          order.menge
      );


  // ---------------------------------------------------
  // BESTÄTIGEN
  // ---------------------------------------------------

  const confirm =
    new ButtonBuilder()

      .setCustomId(
        "order_confirm_" +
        order.id
      )

      .setLabel(
        "Bestätigen"
      )

      .setStyle(
        ButtonStyle.Success
      )

      .setDisabled(
        !isOpen
      );


  // ---------------------------------------------------
  // ABLEHNEN
  // ---------------------------------------------------

  const reject =
    new ButtonBuilder()

      .setCustomId(
        "order_reject_" +
        order.id
      )

      .setLabel(
        "Ablehnen"
      )

      .setStyle(
        ButtonStyle.Danger
      )

      .setDisabled(
        !isOpen
      );


  // ---------------------------------------------------
  // ABSCHLIESSEN
  // ---------------------------------------------------

  const complete =
    new ButtonBuilder()

      .setCustomId(
        "order_complete_" +
        order.id
      )

      .setLabel(
        "Abschließen"
      )

      .setStyle(
        ButtonStyle.Secondary
      )

      .setDisabled(
        !isConfirmed
      );


  return new ActionRowBuilder()
    .addComponents(
      signup,
      confirm,
      reject,
      complete
    );
}


module.exports = {

  buildOrderEmbed,

  buildOrderButtons,
};
```