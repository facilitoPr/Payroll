import { round2 } from "../parse";

  export const patchBankSnapshotAmount = (bankSnapshot: any, netPeriod: number) => {
    if (!bankSnapshot || typeof bankSnapshot !== "object") return bankSnapshot;

    const net = round2(netPeriod);
    const cents = Math.round(net * 100);

    if ("amount" in bankSnapshot) bankSnapshot.amount = net;
    if ("netAmount" in bankSnapshot) bankSnapshot.netAmount = net;
    if ("netToDeposit" in bankSnapshot) bankSnapshot.netToDeposit = net;
    if ("amountToPay" in bankSnapshot) bankSnapshot.amountToPay = net;
    if ("paymentAmount" in bankSnapshot) bankSnapshot.paymentAmount = net;

    if ("amountCents" in bankSnapshot) bankSnapshot.amountCents = cents;
    if ("netCents" in bankSnapshot) bankSnapshot.netCents = cents;

    return bankSnapshot;
  };