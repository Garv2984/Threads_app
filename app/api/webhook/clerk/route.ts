/* eslint-disable camelcase */
// Resource: https://clerk.com/docs/users/sync-data-to-your-backend
// Above article shows why we need webhooks i.e., to sync data to our backend

// Resource: https://docs.svix.com/receiving/verifying-payloads/why
// It's a good practice to verify webhooks. Above article shows why we should do it
import { Webhook, WebhookRequiredHeaders } from "svix";
import { headers } from "next/headers";

import { IncomingHttpHeaders } from "http";

import { NextResponse } from "next/server"; // Ensure NextResponse is imported
import {
  addMemberToCommunity,
  createCommunity,
  deleteCommunity,
  removeUserFromCommunity,
  updateCommunityInfo,
} from "@/lib/actions/community.action";

// Resource: https://clerk.com/docs/integration/webhooks#supported-events
// Above document lists the supported events
type EventType =
  | "organization.created"
  | "organizationInvitation.created"
  | "organizationMembership.created"
  | "organizationMembership.deleted"
  | "organization.updated"
  | "organization.deleted";

type Event = {
  data: Record<string, any>; // Changed to 'any' for better flexibility with Clerk's data types
  object: "event";
  type: EventType;
};

export const POST = async (request: Request) => {
  // Log the start of the webhook process for debugging
  console.log('--- Webhook Handler Started (POST request) ---');

  const payload = await request.json();
  const header = await  headers(); // Get headers correctly

  const heads = {
    "svix-id": header.get("svix-id"),
    "svix-timestamp": header.get("svix-timestamp"),
    "svix-signature": header.get("svix-signature"),
  };

  // Activitate Webhook in the Clerk Dashboard.
  // After adding the endpoint, you'll see the secret on the right side.
  // IMPORTANT: Ensure process.env.NEXT_CLERK_WEBHOOK_SECRET is set correctly in Vercel.
  const WEBHOOK_SECRET = process.env.NEXT_CLERK_WEBHOOK_SECRET || ""; 
  if (!WEBHOOK_SECRET) {
    console.error('WEBHOOK_SECRET is not set in environment variables!');
    return new NextResponse('Error: Webhook secret not configured', { status: 500 });
  }

  const wh = new Webhook(WEBHOOK_SECRET);

  let evnt: Event | null = null;

  try {
    evnt = wh.verify(
      JSON.stringify(payload), // payload needs to be stringified for verification
      heads as IncomingHttpHeaders & WebhookRequiredHeaders
    ) as Event;
    console.log('Webhook signature verified successfully.');
  } catch (err) {
    console.error("Webhook verification failed:", err); // Log the actual verification error
    return NextResponse.json({ message: "Webhook verification failed!" }, { status: 400 });
  }

  const eventType: EventType = evnt?.type!;
  console.log(`Processing webhook event type: "${eventType}"`); // Log the event type

  // Listen organization creation event
  if (eventType === "organization.created") {
    const { id, name, slug, logo_url, image_url, created_by } =
      evnt?.data ?? {};

    try {
      // @ts-ignore
      await createCommunity(
        // @ts-ignore
        id,
        name,
        slug,
        logo_url || image_url, // Use logo_url first, fallback to image_url
        "org bio", // Placeholder bio
        created_by
      );
      console.log(`Successfully processed organization.created: ${name} (${id})`);
      // Return 201 for resource created
      return NextResponse.json({ message: "Community created successfully" }, { status: 201 });
    } catch (err) {
      console.error(`Error processing organization.created for ID ${id}:`, err); // Log specific error
      return NextResponse.json(
        { message: "Internal Server Error during community creation" },
        { status: 500 }
      );
    }
  }

  // Listen organization invitation creation event.
  if (eventType === "organizationInvitation.created") {
    try {
      console.log("Invitation created event data:", evnt?.data);
      // Add your specific logic here if needed
      return NextResponse.json(
        { message: "Invitation created processed" },
        { status: 200 } // Changed to 200 OK
      );
    } catch (err) {
      console.error("Error processing organizationInvitation.created:", err);
      return NextResponse.json(
        { message: "Internal Server Error processing invitation creation" },
        { status: 500 }
      );
    }
  }

  // Listen organization membership (member invite & accepted) creation
  if (eventType === "organizationMembership.created") {
    try {
      const { organization, public_user_data } = evnt?.data;
      console.log("Organization membership created event data:", evnt?.data);

      // @ts-ignore
      await addMemberToCommunity(organization.id, public_user_data.user_id);
      return NextResponse.json(
        { message: "Organization membership processed" },
        { status: 200 }
      );
    } catch (err) {
      console.error("Error processing organizationMembership.created:", err);
      return NextResponse.json(
        { message: "Internal Server Error processing membership creation" },
        { status: 500 }
      );
    }
  }

  // Listen member deletion event
  if (eventType === "organizationMembership.deleted") {
    try {
      const { organization, public_user_data } = evnt?.data;
      console.log("Organization membership deleted event data:", evnt?.data);

      // @ts-ignore
      await removeUserFromCommunity(public_user_data.user_id, organization.id);
      return NextResponse.json({ message: "Member removed processed" }, { status: 200 });
    } catch (err) {
      console.error("Error processing organizationMembership.deleted:", err);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
      );
    }
  }

  // Listen organization updation event
  if (eventType === "organization.updated") {
    try {
      const { id, logo_url, name, slug } = evnt?.data;
      console.log("Organization updated event data:", evnt?.data);

      // @ts-ignore
      await updateCommunityInfo(id, name, slug, logo_url);
      return NextResponse.json({ message: "Organization updated processed" }, { status: 200 });
    } catch (err) {
      console.error("Error processing organization.updated:", err);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
      );
    }
  }

  // Listen organization deletion event
  if (eventType === "organization.deleted") {
    try {
      const { id } = evnt?.data;
      console.log("Organization deleted event data:", evnt?.data);

      // @ts-ignore
      await deleteCommunity(id);
      return NextResponse.json(
        { message: "Organization deletion processed" },
        { status: 200 }
      );
    } catch (err) {
      console.error("Error processing organization.deleted:", err);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
      );
    }
  }

  // --- IMPORTANT: Default return for unhandled event types ---
  // This ensures a valid HTTP response is always sent, even if the event type
  // is not explicitly handled by your if-else if blocks. This prevents 405s or timeouts.
  console.log(`Webhook received, but event type "${eventType}" was not explicitly handled. Responding with 200 OK.`);
  return new NextResponse('Webhook received, event type not explicitly handled', { status: 200 });
};