<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreCartItemRequest;
use App\Http\Requests\UpdateCartItemRequest;
use App\Models\Customer;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function __construct(private readonly CartService $cartService) {}

    public function index(Request $request): Response
    {
        return Inertia::render('Cart/Index', [
            'cart' => $this->cartService->data(
                $this->customer($request),
                $request->session()->getId(),
            ),
        ]);
    }

    public function store(StoreCartItemRequest $request): JsonResponse
    {
        $data = $request->validated();
        $this->cartService->add(
            $this->customer($request),
            $request->session()->getId(),
            (int) $data['variant_id'],
            (int) $data['branch_id'],
            (int) $data['quantity'],
        );

        return $this->cartResponse($request);
    }

    public function update(UpdateCartItemRequest $request, int $item): JsonResponse
    {
        $this->cartService->update(
            $this->customer($request),
            $request->session()->getId(),
            $item,
            (int) $request->validated('quantity'),
        );

        return $this->cartResponse($request);
    }

    public function destroy(Request $request, int $item): JsonResponse
    {
        $this->cartService->remove(
            $this->customer($request),
            $request->session()->getId(),
            $item,
        );

        return $this->cartResponse($request);
    }

    private function cartResponse(Request $request): JsonResponse
    {
        return response()->json([
            'cart' => $this->cartService->data(
                $this->customer($request),
                $request->session()->getId(),
            ),
        ]);
    }

    private function customer(Request $request): ?Customer
    {
        $customer = $request->user('customer');

        return $customer instanceof Customer ? $customer : null;
    }
}
