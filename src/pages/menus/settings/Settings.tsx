import { ProfileSection, AvatarSection } from "./ProfileSection";
import { StravaSection } from "./ExternalConnections";
import { AccountSection } from "./AccountSection";
import styles from "./Settings.module.css";

export default function Settings() {
  return (
    <main className={styles.container}>
      <h1 className={styles.h1}>Einstellungen</h1>
      <ProfileSection />
      <AvatarSection />
      <StravaSection />
      <AccountSection />
    </main>
  );
}
