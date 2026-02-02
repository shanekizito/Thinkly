import firestore from '@react-native-firebase/firestore';
import { db } from '@services/firebaseConfig';
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useBadgeEarn } from "../contexts/BadgesContext";
import { useLocalization } from "../contexts/LocalizationContext";

export const badges = [
    {
        key: 'firstLesson',
        slug: 'first-lesson',
        icon: require('../../assets/badges/first-lesson.png'),
        color: 'rgba(237, 165, 60, 1)',
    },
    {
        key: 'streakStarter',
        slug: 'streak-starter',
        icon: require('../../assets/badges/streak-starter.png'),
        color: 'rgba(236, 110, 59, 1)',
    },
    {
        key: 'superLearner',
        slug: 'super-learner',
        icon: require('../../assets/badges/super-learner.png'),
        color: 'rgba(62, 212, 99, 1)',
    },
    {
        key: 'curiousMind',
        slug: 'curious-mind',
        icon: require('../../assets/badges/curious-mind.png'),
        color: 'rgba(102, 210, 248, 1)',
    },
    {
        key: 'dedicated',
        slug: 'dedicated',
        icon: require('../../assets/badges/dedicated.png'),
        color: 'rgba(140, 119, 247, 1)',
    },
    {
        key: 'weekOne',
        slug: 'week-one',
        icon: require('../../assets/badges/week-one.png'),
        color: 'rgba(250, 208, 71, 1)',
    },
]

export const useBadges = () => {
    const { t } = useLocalization();
    const { setEarnedBadge } = useBadgeEarn();
    const { user } = useAuth();
    const [achivedBadges, setAchivedBadges] = useState([]);

    const data = badges.map((badge) => {
        const key = badge.key;
        const content = t.badgesObject[key] ?? {};
        return { ...badge, ...content }
    })

    useEffect(() => {
        if (!user) return;
        const userRef = db.collection('users').doc(user.uid);
        const unsubscribeUser = userRef.onSnapshot((docSnapshot) => {
            const data = docSnapshot.data();
            setAchivedBadges(data?.badges ?? []);
        });

        return () => { unsubscribeUser(); };
    }, [user]);


    const addBadge = async (badge: string) => {
        try {
            if (user === null) return;

            const docRef = db.collection('users').doc(user.uid);
            const docSnapshot = await docRef.get();

            const data = docSnapshot.data();
            const existingBadges = data?.badges || [];

            if (!existingBadges.includes(badge)) {
                await docRef.update({
                    badges: firestore.FieldValue.arrayUnion(badge),
                });
                setEarnedBadge(badge);
            }
            console.log('Badge updated successfully : ', badge);
        } catch (error) {
            console.log('Error updating badges:', error);
        }
    }

    return { badges: data, addBadge, achivedBadges }
}