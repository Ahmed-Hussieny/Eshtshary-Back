import { scheduleJob } from "node-schedule";
import ClientUser from "../../DB/Models/clientUser.model.js";
import moment from "moment";
import PaymentPackage from "../../DB/Models/paymentPackage.model.js";

export async function cronToCheckSubscription() {
  scheduleJob("0 0 * * *", async () => {
    const today = new Date();
    const users = await ClientUser.find({ subscribed: true });
    for (let user of users) {
      const { _id, startDate, endDate } = user;

      if (!startDate || !endDate) continue;

      const start = moment(startDate);
      const end = moment(endDate);
      const now = moment(today);

      const daysSinceStart = now.diff(start, "days");
      const paymentPackage = await PaymentPackage.findById(user.packageId);
      if (!paymentPackage) continue;
      await ClientUser.updateOne({ _id }, { $set: { maxNumberOfReports: paymentPackage.maxNumberOfReports } });
      console.log(`Reports reset for user: ${user.username} (Day ${daysSinceStart})`);

      if (now.isAfter(end)) {
        await ClientUser.updateOne({ _id }, { $set: { subscribed: false } });
        console.log(`Subscription expired for user: ${user.username}`);
      }
  }
  });
}
