/** Brokers supported by the system. */
export enum Broker {
  ALICE_BLUE = 'AliceBlue',
  ANGEL_ONE = 'Angel One',
  DHAN = 'Dhan',
  FYERS = 'Fyers',
  HDFC_SECURITIES = 'Hdfc Securities',
  ICICI_DIRECT = 'ICICI Direct',
  IIFL_SECURITIES = 'IIFL Securities',
  KOTAK = 'Kotak',
  UPSTOX = 'Upstox',
  ZERODHA = 'Zerodha',
}

export namespace Broker {
  export function getImageUrl(broker: Broker): string {
    switch (broker) {
      case Broker.ALICE_BLUE:
        return 'brokers/alice_blue.png';
      case Broker.ANGEL_ONE:
        return 'brokers/angel_one.png';
      case Broker.DHAN:
        return 'brokers/dhan.png';
      case Broker.FYERS:
        return 'brokers/fyers.png';
      case Broker.HDFC_SECURITIES:
        return 'brokers/hdfc_securities.png';
      case Broker.ICICI_DIRECT:
        return 'brokers/icici_direct.png';
      case Broker.IIFL_SECURITIES:
        return 'brokers/iifl_securities.png';
      case Broker.KOTAK:
        return 'brokers/kotak.png';
      case Broker.UPSTOX:
        return 'brokers/upstox.svg';
      case Broker.ZERODHA:
        return 'brokers/zerodha.png';
    }
  }
}
