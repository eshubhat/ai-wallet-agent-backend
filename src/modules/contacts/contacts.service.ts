import prisma from '../../config/prisma';

export class ContactsService {
    async createContact(userId: string, name: string, walletAddress: string) {
        return prisma.contact.create({
            data: {
                userId,
                name,
                walletAddress,
            },
        });
    }

    async getContacts(userId: string) {
        return prisma.contact.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async searchContacts(userId: string, query: string) {
        return prisma.contact.findMany({
            where: {
                userId,
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { walletAddress: { contains: query, mode: 'insensitive' } },
                ],
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async deleteContact(userId: string, contactId: string) {
        // Verify the contact exists and belongs to the user
        const contact = await prisma.contact.findUnique({
            where: { id: contactId },
        });

        if (!contact || contact.userId !== userId) {
            throw new Error('Contact not found or unauthorized');
        }

        return prisma.contact.delete({
            where: { id: contactId },
        });
    }
}

export const contactsService = new ContactsService();
