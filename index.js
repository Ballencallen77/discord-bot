```js
require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  PermissionsBitField,
} = require("discord.js");

const store = require("./store");
const {
  buildOrderEmbed,
  buildOrderButtons,
} = require("./embeds");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const STAFF_ROLE_ID =
  process.env.STAFF_ROLE_ID || null;

const ORDER_CHANNEL_ID =
  process.env.ORDER_CHANNEL_ID || null;


// =====================================================
// BOT START
// =====================================================

client.once("ready", () => {
  console.log(
    `Eingeloggt als ${client.user.tag}`
  );
});


// =====================================================
// INTERACTION HANDLER
// =====================================================

client.on("interactionCreate", async (interaction) => {

  try {

    if (interaction.isChatInputCommand()) {

      await handleSlashCommand(interaction);

    } else if (interaction.isModalSubmit()) {

      await handleModalSubmit(interaction);

    } else if (interaction.isButton()) {

      await handleButton(interaction);
    }

  } catch (err) {

    console.error(err);

    const payload = {
      content:
        "Da ist etwas schiefgelaufen. Bitte nochmal versuchen.",
      ephemeral: true,
    };

    if (
      interaction.deferred ||
      interaction.replied
    ) {

      await interaction
        .followUp(payload)
        .catch(() => {});

    } else {

      await interaction
        .reply(payload)
        .catch(() => {});
    }
  }
});


// =====================================================
// SLASH COMMANDS
// =====================================================

async function handleSlashCommand(interaction) {


  // ===================================================
  // /bestellung
  // ===================================================

  if (
    interaction.commandName ===
    "bestellung"
  ) {

    const modal =
      new ModalBuilder()
        .setCustomId(
          "bestellung_modal"
        )
        .setTitle(
          "Ausrüstungsbestellung"
        );


    const artikelInput =
      new TextInputBuilder()
        .setCustomId(
          "artikel"
        )
        .setLabel(
          "Artikel"
        )
        .setPlaceholder(
          "z. B. ADV Scope"
        )
        .setStyle(
          TextInputStyle.Short
        )
        .setRequired(true);


    const mengeInput =
      new TextInputBuilder()
        .setCustomId(
          "menge"
        )
        .setLabel(
          "Menge"
        )
        .setPlaceholder(
          "z. B. 30"
        )
        .setStyle(
          TextInputStyle.Short
        )
        .setRequired(true);


    const zugewiesenAnInput =
      new TextInputBuilder()
        .setCustomId(
          "zugewiesen_an"
        )
        .setLabel(
          "Zugewiesen an"
        )
        .setPlaceholder(
          "Name des Mitglieds"
        )
        .setStyle(
          TextInputStyle.Short
        )
        .setRequired(true);


    const angefordertVonInput =
      new TextInputBuilder()
        .setCustomId(
          "angefordert_von"
        )
        .setLabel(
          "Angefordert von"
        )
        .setPlaceholder(
          "Dein Name"
        )
        .setStyle(
          TextInputStyle.Short
        )
        .setRequired(true);


    const abteilungGrundInput =
      new TextInputBuilder()
        .setCustomId(
          "abteilung_grund"
        )
        .setLabel(
          "Abteilung / Grund"
        )
        .setPlaceholder(
          "z. B. LSPD – Streife, Einsatzvorbereitung ..."
        )
        .setStyle(
          TextInputStyle.Paragraph
        )
        .setRequired(false);


    modal.addComponents(

      new ActionRowBuilder()
        .addComponents(
          artikelInput
        ),

      new ActionRowBuilder()
        .addComponents(
          mengeInput
        ),

      new ActionRowBuilder()
        .addComponents(
          zugewiesenAnInput
        ),

      new ActionRowBuilder()
        .addComponents(
          angefordertVonInput
        ),

      new ActionRowBuilder()
        .addComponents(
          abteilungGrundInput
        )
    );


    await interaction.showModal(
      modal
    );

    return;
  }


  // ===================================================
  // /bestellungen
  // ===================================================

  if (
    interaction.commandName ===
    "bestellungen"
  ) {

    const open =
      store.getOpenOrders();

    if (
      open.length === 0
    ) {

      await interaction.reply({
        content:
          "Keine offenen Bestellungen.",
        ephemeral: true,
      });

      return;
    }


    const lines =
      open.map((o) => {

        const angemeldet =
          o.angemeldeteMenge || 0;

        const rest =
          Math.max(
            0,
            o.menge -
              angemeldet
          );


        return (
          `**${o.id}** · ` +
          `${o.artikel} · ` +
          `**${angemeldet}/${o.menge}** ` +
          `(${rest} offen) → ` +
          `${o.zugewiesenAn} ` +
          `(angefordert von ` +
          `${o.angefordertVon})`
        );
      });


    await interaction.reply({

      content:
        lines.join("\n"),

      ephemeral: true,
    });

    return;
  }
}


// =====================================================
// MODALS
// =====================================================

async function handleModalSubmit(
  interaction
) {


  // ===================================================
  // NEUE BESTELLUNG
  // ===================================================

  if (
    interaction.customId ===
    "bestellung_modal"
  ) {

    const artikel =
      interaction.fields
        .getTextInputValue(
          "artikel"
        )
        .trim();


    const mengeRaw =
      interaction.fields
        .getTextInputValue(
          "menge"
        )
        .trim();


    const zugewiesenAn =
      interaction.fields
        .getTextInputValue(
          "zugewiesen_an"
        )
        .trim();


    const angefordertVon =
      interaction.fields
        .getTextInputValue(
          "angefordert_von"
        )
        .trim();


    const abteilungGrund =
      interaction.fields
        .getTextInputValue(
          "abteilung_grund"
        )
        .trim();


    const menge =
      parseInt(
        mengeRaw,
        10
      );


    if (
      isNaN(menge) ||
      menge <= 0
    ) {

      await interaction.reply({

        content:
          "❌ Menge muss eine ganze Zahl größer als 0 sein.",

        ephemeral: true,
      });

      return;
    }


    const order =
      store.createOrder({

        artikel,

        menge,

        zugewiesenAn,

        angefordertVon,

        abteilungGrund,
      });


    const targetChannel =
      ORDER_CHANNEL_ID

        ? await client.channels
            .fetch(
              ORDER_CHANNEL_ID
            )
            .catch(() => null)

        : interaction.channel;


    if (!targetChannel) {

      await interaction.reply({

        content:
          "❌ Bestellkanal nicht gefunden. Bitte ORDER_CHANNEL_ID prüfen.",

        ephemeral: true,
      });

      return;
    }


    const message =
      await targetChannel.send({

        embeds: [
          buildOrderEmbed(
            order
          ),
        ],

        components: [
          buildOrderButtons(
            order
          ),
        ],
      });


    store.setOrderMessage(

      order.id,

      message.id,

      message.channelId
    );


    await interaction.reply({

      content:
        `✅ Bestellung ${order.id} wurde aufgegeben.`,

      ephemeral: true,
    });

    return;
  }


  // ===================================================
  // MENGENANMELDUNG
  // ===================================================

  const signupMatch =
    interaction.customId.match(
      /^order_signup_modal_(.+)$/
    );


  if (!signupMatch) {
    return;
  }


  const orderId =
    signupMatch[1];


  const order =
    store.getOrder(
      orderId
    );


  if (!order) {

    await interaction.reply({

      content:
        "❌ Bestellung nicht gefunden.",

      ephemeral: true,
    });

    return;
  }


  if (
    order.status !==
    "Ausstehend"
  ) {

    await interaction.reply({

      content:
        `❌ Die Bestellung ${orderId} ist bereits **${order.status}**.`,

      ephemeral: true,
    });

    return;
  }


  const angemeldeteMenge =
    order.angemeldeteMenge || 0;


  const restlicheMenge =
    order.menge -
    angemeldeteMenge;


  if (
    restlicheMenge <= 0
  ) {

    await interaction.reply({

      content:
        "❌ Die komplette Bestellmenge wurde bereits abgedeckt.",

      ephemeral: true,
    });

    return;
  }


  const mengeRaw =
    interaction.fields
      .getTextInputValue(
        "anmelde_menge"
      )
      .trim();


  const menge =
    parseInt(
      mengeRaw,
      10
    );


  if (
    isNaN(menge) ||
    menge <= 0
  ) {

    await interaction.reply({

      content:
        "❌ Bitte gib eine ganze Zahl größer als 0 ein.",

      ephemeral: true,
    });

    return;
  }


  if (
    store.getSignup(
      orderId,
      interaction.user.id
    )
  ) {

    await interaction.reply({

      content:
        "❌ Du bist für diese Bestellung bereits angemeldet.",

      ephemeral: true,
    });

    return;
  }


  if (
    menge >
    restlicheMenge
  ) {

    await interaction.reply({

      content:
        `❌ Du kannst maximal **${restlicheMenge} Stück** anmelden.\n\n` +
        `Bereits angemeldet: **${angemeldeteMenge}/${order.menge}**`,

      ephemeral: true,
    });

    return;
  }


  const updated =
    store.addSignup(

      orderId,

      interaction.user.id,

      interaction.user.username,

      menge
    );


  if (!updated) {

    await interaction.reply({

      content:
        "❌ Die Anmeldung konnte nicht gespeichert werden.",

      ephemeral: true,
    });

    return;
  }


  // Discord-Nachricht aktualisieren

  await updateOrderMessage(
    updated
  );


  const neuerStand =
    updated.angemeldeteMenge || 0;


  const rest =
    Math.max(
      0,
      updated.menge -
        neuerStand
    );


  await interaction.reply({

    content:
      `✅ Du hast dich erfolgreich angemeldet.\n\n` +
      `**Deine Menge:** ${menge} Stück\n` +
      `**Gesamt:** ${neuerStand}/${updated.menge} Stück\n` +
      `**Noch offen:** ${rest} Stück`,

    ephemeral: true,
  });

  return;
}


// =====================================================
// BUTTONS
// =====================================================

async function handleButton(
  interaction
) {


  // ===================================================
  // ANMELDEN
  // ===================================================

  const signupMatch =
    interaction.customId.match(
      /^order_signup_(.+)$/
    );


  if (signupMatch) {

    const orderId =
      signupMatch[1];


    const order =
      store.getOrder(
        orderId
      );


    if (!order) {

      await interaction.reply({

        content:
          "❌ Bestellung nicht gefunden.",

        ephemeral: true,
      });

      return;
    }


    if (
      order.status !==
      "Ausstehend"
    ) {

      await interaction.reply({

        content:
          `❌ Die Bestellung ${orderId} ist bereits **${order.status}**.`,

        ephemeral: true,
      });

      return;
    }


    const angemeldeteMenge =
      order.angemeldeteMenge || 0;


    const restlicheMenge =
      order.menge -
      angemeldeteMenge;


    if (
      restlicheMenge <= 0
    ) {

      await interaction.reply({

        content:
          "❌ Die komplette Bestellmenge wurde bereits abgedeckt.",

        ephemeral: true,
      });

      return;
    }


    if (
      store.getSignup(
        orderId,
        interaction.user.id
      )
    ) {

      await interaction.reply({

        content:
          "❌ Du bist für diese Bestellung bereits angemeldet.",

        ephemeral: true,
      });

      return;
    }


    const modal =
      new ModalBuilder()
        .setCustomId(
          `order_signup_modal_${orderId}`
        )
        .setTitle(
          "Für Bestellung anmelden"
        );


    const mengeInput =
      new TextInputBuilder()
        .setCustomId(
          "anmelde_menge"
        )
        .setLabel(
          "Wie viele Stück möchtest du herstellen?"
        )
        .setPlaceholder(
          `Noch offen: ${restlicheMenge} Stück`
        )
        .setStyle(
          TextInputStyle.Short
        )
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(10);


    modal.addComponents(

      new ActionRowBuilder()
        .addComponents(
          mengeInput
        )
    );


    await interaction.showModal(
      modal
    );

    return;
  }


  // ===================================================
  // BESTÄTIGEN
  // ===================================================

  const confirmMatch =
    interaction.customId.match(
      /^order_confirm_(.+)$/
    );


  if (confirmMatch) {

    const orderId =
      confirmMatch[1];


    await handleStaffStatus(
      interaction,
      orderId,
      "Bestätigt"
    );

    return;
  }


  // ===================================================
  // ABLEHNEN
  // ===================================================

  const rejectMatch =
    interaction.customId.match(
      /^order_reject_(.+)$/
    );


  if (rejectMatch) {

    const orderId =
      rejectMatch[1];


    await handleStaffStatus(
      interaction,
      orderId,
      "Abgelehnt"
    );

    return;
  }


  // ===================================================
  // ABSCHLIESSEN
  // ===================================================

  const completeMatch =
    interaction.customId.match(
      /^order_complete_(.+)$/
    );


  if (completeMatch) {

    const orderId =
      completeMatch[1];


    await handleStaffStatus(
      interaction,
      orderId,
      "Abgeschlossen"
    );

    return;
  }
}


// =====================================================
// STAFF STATUS ÄNDERN
// =====================================================

async function handleStaffStatus(
  interaction,
  orderId,
  newStatus
) {


  if (
    !memberIsStaff(
      interaction
    )
  ) {

    await interaction.reply({

      content:
        "❌ Dafür hast du keine Berechtigung.",

      ephemeral: true,
    });

    return;
  }


  const order =
    store.getOrder(
      orderId
    );


  if (!order) {

    await interaction.reply({

      content:
        "❌ Bestellung nicht gefunden.",

      ephemeral: true,
    });

    return;
  }


  // Abgeschlossene Bestellung nicht mehr bearbeiten

  if (
    order.status ===
    "Abgeschlossen"
  ) {

    await interaction.reply({

      content:
        `❌ Bestellung ${orderId} ist bereits abgeschlossen.`,

      ephemeral: true,
    });

    return;
  }


  // Abgelehnte Bestellung nicht weiter bearbeiten

  if (
    order.status ===
      "Abgelehnt" &&
    newStatus !==
      "Abgeschlossen"
  ) {

    await interaction.reply({

      content:
        `❌ Bestellung ${orderId} wurde bereits abgelehnt.`,

      ephemeral: true,
    });

    return;
  }


  const updated =
    store.updateOrderStatus(
      orderId,
      newStatus
    );


  await interaction.update({

    embeds: [
      buildOrderEmbed(
        updated
      ),
    ],

    components: [
      buildOrderButtons(
        updated
      ),
    ],
  });


  await interaction.followUp({

    content:
      `📦 Bestellung ${orderId} wurde von ${interaction.user} auf **${newStatus}** gesetzt.`,

  });
}


// =====================================================
// BESTELLMELDUNG AKTUALISIEREN
// =====================================================

async function updateOrderMessage(
  order
) {

  if (
    !order.messageId ||
    !order.channelId
  ) {
    return;
  }


  const channel =
    await client.channels
      .fetch(
        order.channelId
      )
      .catch(() => null);


  if (!channel) {
    return;
  }


  const message =
    await channel.messages
      .fetch(
        order.messageId
      )
      .catch(() => null);


  if (!message) {
    return;
  }


  await message.edit({

    embeds: [
      buildOrderEmbed(
        order
      ),
    ],

    components: [
      buildOrderButtons(
        order
      ),
    ],

  }).catch(() => {});
}


// =====================================================
// STAFF PRÜFUNG
// =====================================================

function memberIsStaff(
  interaction
) {

  if (!STAFF_ROLE_ID) {

    return (
      interaction.memberPermissions?.has(
        PermissionsBitField.Flags.ManageMessages
      ) ?? false
    );
  }


  return (
    interaction.member?.roles?.cache?.has(
      STAFF_ROLE_ID
    ) ?? false
  );
}


// =====================================================
// BOT LOGIN
// =====================================================

client.login(
  process.env.DISCORD_TOKEN
);
```