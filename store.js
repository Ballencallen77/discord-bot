```js
// =====================================================
// JSON-SPEICHER FÜR BESTELLUNGEN
// =====================================================

const fs =
  require("fs");

const path =
  require("path");


const DATA_DIR =
  path.join(
    __dirname,
    "data"
  );


const DATA_FILE =
  path.join(
    DATA_DIR,
    "orders.json"
  );


// =====================================================
// SPEICHER SICHERSTELLEN
// =====================================================

function ensureStore() {

  if (
    !fs.existsSync(
      DATA_DIR
    )
  ) {

    fs.mkdirSync(
      DATA_DIR,
      {
        recursive:
          true,
      }
    );
  }


  if (
    !fs.existsSync(
      DATA_FILE
    )
  ) {

    fs.writeFileSync(

      DATA_FILE,

      JSON.stringify(

        {
          nextId:
            1001,

          orders:
            [],
        },

        null,

        2
      )
    );
  }
}


// =====================================================
// LESEN
// =====================================================

function readStore() {

  ensureStore();

  return JSON.parse(

    fs.readFileSync(

      DATA_FILE,

      "utf8"
    )
  );
}


// =====================================================
// SCHREIBEN
// =====================================================

function writeStore(
  data
) {

  fs.writeFileSync(

    DATA_FILE,

    JSON.stringify(

      data,

      null,

      2
    )
  );
}


// =====================================================
// BESTELLUNG ERSTELLEN
// =====================================================

function createOrder(
  order
) {

  const data =
    readStore();


  const id =
    "B-" +
    data.nextId;


  data.nextId +=
    1;


  const fullOrder = {

    id:

      id,

    artikel:

      order.artikel,

    menge:

      order.menge,


    // Menge, die bereits von
    // Herstellern übernommen wurde

    angemeldeteMenge:
      0,


    // Personen, die sich
    // angemeldet haben

    anmeldungen:
      [],


    zugewiesenAn:

      order.zugewiesenAn,

    angefordertVon:

      order.angefordertVon,

    abteilungGrund:

      order.abteilungGrund,

    status:

      "Ausstehend",

    erstelltAm:

      new Date()
        .toISOString(),

    messageId:

      null,

    channelId:

      null,
  };


  data.orders.push(
    fullOrder
  );


  writeStore(
    data
  );


  return fullOrder;
}


// =====================================================
// DISCORD-NACHRICHT SPEICHERN
// =====================================================

function setOrderMessage(
  id,
  messageId,
  channelId
) {

  const data =
    readStore();


  const order =
    data.orders.find(
      (o) =>
        o.id === id
    );


  if (order) {

    order.messageId =
      messageId;

    order.channelId =
      channelId;


    writeStore(
      data
    );
  }


  return order;
}


// =====================================================
// STATUS ÄNDERN
// =====================================================

function updateOrderStatus(
  id,
  status
) {

  const data =
    readStore();


  const order =
    data.orders.find(
      (o) =>
        o.id === id
    );


  if (order) {

    order.status =
      status;


    writeStore(
      data
    );
  }


  return order;
}


// =====================================================
// BESTELLUNG HOLEN
// =====================================================

function getOrder(
  id
) {

  const data =
    readStore();


  const order =
    data.orders.find(
      (o) =>
        o.id === id
    );


  if (!order) {
    return null;
  }


  // Kompatibilität mit
  // alten Bestellungen

  if (
    typeof order.angemeldeteMenge !==
    "number"
  ) {

    order.angemeldeteMenge =
      0;
  }


  if (
    !Array.isArray(
      order.anmeldungen
    )
  ) {

    order.anmeldungen =
      [];
  }


  return order;
}


// =====================================================
// OFFENE BESTELLUNGEN
// =====================================================

function getOpenOrders() {

  const data =
    readStore();


  return data.orders.filter(

    (o) =>

      o.status ===
      "Ausstehend" ||

      o.status ===
      "Bestätigt"
  );
}


// =====================================================
// ANMELDUNG SUCHEN
// =====================================================

function getSignup(
  orderId,
  userId
) {

  const order =
    getOrder(
      orderId
    );


  if (!order) {
    return null;
  }


  return order.anmeldungen.find(

    (a) =>

      a.userId ===
      userId
  );
}


// =====================================================
// ANMELDUNG HINZUFÜGEN
// =====================================================

function addSignup(

  orderId,

  userId,

  username,

  menge

) {

  const data =
    readStore();


  const order =
    data.orders.find(

      (o) =>

        o.id ===
        orderId
    );


  if (!order) {
    return null;
  }


  // Alte Bestellung
  // kompatibel machen

  if (
    typeof order.angemeldeteMenge !==
    "number"
  ) {

    order.angemeldeteMenge =
      0;
  }


  if (
    !Array.isArray(
      order.anmeldungen
    )
  ) {

    order.anmeldungen =
      [];
  }


  // Bereits angemeldet?

  const existing =
    order.anmeldungen.find(

      (a) =>

        a.userId ===
        userId
    );


  if (existing) {
    return null;
  }


  // Verfügbare Menge

  const restlicheMenge =
    order.menge -
    order.angemeldeteMenge;


  if (
    menge >
    restlicheMenge
  ) {

    return null;
  }


  // Anmeldung speichern

  order.anmeldungen.push({

    userId:

      userId,

    username:

      username,

    menge:

      menge,

    angemeldetAm:

      new Date()
        .toISOString(),
  });


  // Gesamtmenge erhöhen

  order.angemeldeteMenge +=
    menge;


  writeStore(
    data
  );


  return order;
}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

  createOrder,

  setOrderMessage,

  updateOrderStatus,

  getOrder,

  getOpenOrders,

  getSignup,

  addSignup,
};
```
